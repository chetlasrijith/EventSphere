"""Admin and SuperAdmin routes.

Path redesign:

    GET    /api/admin/getMe                     -> GET   /api/admins/me
    GET    /api/admin/getName                   -> GET   /api/admins/me/summary
    PUT    /api/admin/update-profile            -> PATCH /api/admins/me
    POST   /api/admin/add-artist                -> POST  /api/admins/artists
    POST   /api/admin/message-organizer         -> POST  /api/admins/organizers/{id}/messages
    POST   /api/admin/update-to-attendee        -> POST  /api/admins/broadcasts
    DELETE /api/admin/deleteOrganizer?username  -> DELETE /api/admins/organizers/{id}
    PUT    /api/admin/:id/approveAdmin          -> POST  /api/admins/{id}/approval
    PUT    /api/admin/:id/rejectAdmin           -> POST  /api/admins/{id}/rejection

The approve/reject handlers replaced originals that referenced undefined
variables (`adminId`, `userId`) and could not complete.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Query, Response, status

from sqlalchemy import func, select

from app.api.deps.auth import CurrentAdmin, CurrentSuperAdmin, DbSession
from app.core.errors import ConflictError, NotFoundError
from app.core.security import hash_password
from app.models.enums import AdminStatus, NotificationSender, UserRole
from app.models.notification import RecipientKind
from app.models.user import Admin, Artist, SuperAdminWhitelist
from app.schemas.common import Page
from app.schemas.event import BroadcastOut, MessageSend
from app.schemas.user import (
    AdminDecision,
    AdminUpdate,
    AdminWithRole,
    ArtistCreate,
    ArtistOut,
    OrganizerAdminOut,
)
from app.services import notifications as notification_service
from app.services import profiles as profile_service

router = APIRouter(prefix="/api/admins", tags=["admins"])


@router.get("/me", response_model=AdminWithRole)
async def get_me(admin: CurrentAdmin, session: DbSession):
    """The signed-in admin's own account.

    Note: the original frontend called `PUT /api/admin/update-profile`, which
    was never implemented. The update path is `PATCH /api/admins/me`.
    """
    role = UserRole.ADMIN
    whitelisted = await session.scalar(
        select(SuperAdminWhitelist.id).where(SuperAdminWhitelist.email == admin.email)
    )
    if whitelisted is not None:
        role = UserRole.SUPERADMIN
    return {**AdminWithRole.model_validate(admin).model_dump(), "role": role}


@router.get("/me/summary")
async def get_summary(admin: CurrentAdmin):
    return {"name": admin.username, "email": admin.email, "status": admin.status.value}


@router.patch("/me", response_model=AdminWithRole)
async def update_me(
    payload: AdminUpdate, admin: CurrentAdmin, session: DbSession
):
    if payload.username and payload.username != admin.username:
        clash = await session.scalar(
            select(Admin).where(Admin.username == payload.username, Admin.id != admin.id)
        )
        if clash:
            raise ConflictError("That username is taken", code="username_taken")
        admin.username = payload.username
    if payload.email and payload.email != admin.email:
        clash = await session.scalar(
            select(Admin).where(Admin.email == payload.email, Admin.id != admin.id)
        )
        if clash:
            raise ConflictError("That email is taken", code="email_taken")
        admin.email = payload.email
    if payload.password:
        admin.password_hash = hash_password(payload.password)
    await session.commit()
    await session.refresh(admin)
    return admin


@router.post("/artists", response_model=ArtistOut, status_code=status.HTTP_201_CREATED)
async def create_artist(payload: ArtistCreate, admin: CurrentAdmin, session: DbSession):
    links = payload.social_links
    artist = Artist(
        artist_name=payload.artist_name,
        genre=payload.genre,
        bio=payload.bio or "No bio available",
        birth_date=payload.birth_date,
        website=links.website,
        instagram=links.instagram,
        twitter=links.twitter,
    )
    session.add(artist)
    await session.commit()
    await session.refresh(artist)
    return artist


@router.get("/artists", response_model=list[ArtistOut])
async def list_artists(session: DbSession, admin: CurrentAdmin):
    return list((await session.scalars(select(Artist).order_by(Artist.artist_name))).all())


@router.post("/organizers/{organizer_id}/messages", status_code=status.HTTP_201_CREATED)
async def message_organizer(
    organizer_id: int,
    payload: MessageSend,
    admin: CurrentAdmin,
    session: DbSession,
):
    """Message one organizer.

    Replaces the original `POST /api/:organizerId/message`, which read
    `req.user_id` (always undefined) and 400'd on every call.
    """
    organizer = await profile_service.get_organizer(session, organizer_id)
    await notification_service.notify(
        session,
        recipient_kind=RecipientKind.ORGANIZER,
        recipient_id=organizer.id,
        sender_kind=NotificationSender.ADMIN,
        sender_id=admin.id,
        sender_name=admin.username,
        subject=payload.subject,
        message=payload.message,
    )
    await session.commit()
    return {"detail": "Notification sent", "recipient": organizer.username}


@router.post("/broadcasts", response_model=BroadcastOut)
async def broadcast_to_attendees(
    payload: MessageSend, admin: CurrentAdmin, session: DbSession
):
    """Notify every attendee. Replaces /api/admin/update-to-attendee."""
    count = await notification_service.broadcast(
        session,
        recipient_kind=RecipientKind.ATTENDEE,
        sender_kind=NotificationSender.ADMIN,
        sender_id=admin.id,
        sender_name=admin.username,
        subject=payload.subject,
        message=payload.message,
    )
    await session.commit()
    return BroadcastOut(recipients=count)


@router.get("/organizers/{organizer_id}", response_model=OrganizerAdminOut)
async def get_organizer(
    organizer_id: int, admin: CurrentAdmin, session: DbSession
):
    """Full organizer record, including contact details. Admin only."""
    return await profile_service.get_organizer(session, organizer_id)


@router.delete("/organizers/{organizer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_organizer(
    organizer_id: int, admin: CurrentAdmin, session: DbSession
):
    """Delete an organizer and everything they own.

    Replaces the original query-string delete, which passed a bare string where
    an ObjectId was expected and never removed anything.
    """
    organizer = await profile_service.get_organizer(session, organizer_id)
    await profile_service.delete_organizer(session, organizer)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --------------------------------------------------------------------------- #
# SuperAdmin: admin account approval
# --------------------------------------------------------------------------- #


@router.post("/{admin_id}/approval", response_model=AdminWithRole)
async def approve_admin(
    admin_id: int,
    superadmin: CurrentSuperAdmin,
    session: DbSession,
    payload: AdminDecision | None = None,
):
    """Approve a pending admin.

    Fixed: the original referenced undefined `adminId`/`userId` and never
    completed.
    """
    target = await session.get(Admin, admin_id)
    if target is None:
        raise NotFoundError("Admin not found", code="admin_not_found")
    if target.id == superadmin.id:
        raise ConflictError("You cannot approve your own account", code="self_approval")
    if target.status is AdminStatus.APPROVED:
        raise ConflictError("This admin is already approved", code="already_approved")

    target.status = AdminStatus.APPROVED
    target.approved_by_id = superadmin.id
    await session.commit()
    await session.refresh(target)

    await notification_service.notify(
        session,
        recipient_kind=RecipientKind.ADMIN,
        recipient_id=target.id,
        sender_kind=NotificationSender.ADMIN,
        sender_id=superadmin.id,
        sender_name=superadmin.username,
        subject="Admin access granted",
        message=(
            f"Hello {target.username}, your request for admin access has been approved. "
            "You can now use the admin panel."
        ),
    )
    await session.commit()
    return target


@router.post("/{admin_id}/rejection", response_model=AdminWithRole)
async def reject_admin(
    admin_id: int,
    superadmin: CurrentSuperAdmin,
    session: DbSession,
    payload: AdminDecision | None = None,
):
    """Reject a pending admin.

    Fixed: the original set `status = 'approved'` in the reject branch, so
    rejecting an admin actually approved them.
    """
    target = await session.get(Admin, admin_id)
    if target is None:
        raise NotFoundError("Admin not found", code="admin_not_found")
    if target.id == superadmin.id:
        raise ConflictError("You cannot reject your own account", code="self_rejection")

    target.status = AdminStatus.REJECTED
    target.approved_by_id = superadmin.id
    await session.commit()
    await session.refresh(target)

    await notification_service.notify(
        session,
        recipient_kind=RecipientKind.ADMIN,
        recipient_id=target.id,
        sender_kind=NotificationSender.ADMIN,
        sender_id=superadmin.id,
        sender_name=superadmin.username,
        subject="Admin access request declined",
        message=(
            f"Hello {target.username}, your request for admin access was reviewed and "
            f"declined.{(payload.reason if payload else '')}"
        ),
    )
    await session.commit()
    return target


@router.get("/pending/requests", response_model=Page[AdminWithRole])
async def list_pending_admins(
    superadmin: CurrentSuperAdmin,
    session: DbSession,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
):
    """Admins awaiting a decision."""
    base = [Admin.status == AdminStatus.PENDING]
    total = await session.scalar(select(func.count(Admin.id)).where(*base)) or 0
    items = list(
        (
            await session.scalars(
                select(Admin)
                .where(*base)
                .order_by(Admin.created_at.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        ).all()
    )
    return Page.build(items, page=page, page_size=page_size, total=total)