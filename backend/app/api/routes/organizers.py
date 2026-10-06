"""Organizer routes.

Path redesign:

    GET  /api/organizer/profile              -> GET   /api/organizers/me
    PUT  /api/organizer/profile              -> PATCH /api/organizers/me
    PUT  /api/organizer/updateProfileImage   -> PUT   /api/organizers/me/profile-image
    PUT  /api/organizer/updateCoverImage     -> PUT   /api/organizers/me/cover-image
    GET  /api/organizer/getName              -> GET   /api/organizers/me/summary
    POST /api/organizer/messageAdmin         -> POST  /api/organizers/me/messages
    POST /api/organizer/update-to-attendee   -> POST  /api/organizers/me/broadcasts
    GET  /api/admin/getOrganizer/:id         -> GET   /api/organizers/{id}
    GET  /api/admin/list-organizers          -> GET   /api/organizers
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy import select

from app.api.deps.auth import CurrentAdmin, CurrentOrganizer, DbSession
from app.core.errors import NotFoundError
from app.models.enums import NotificationSender
from app.models.notification import RecipientKind
from app.models.user import Admin
from app.schemas.common import Page, PaginationParams, pagination_from_query
from app.schemas.user import (
    ExperienceIn,
    OrganizerAdminOut,
    OrganizerUpdate,
)
from app.schemas.event import BroadcastOut, MessageSend
from app.services import notifications as notification_service
from app.services import profiles as profile_service

router = APIRouter(prefix="/api/organizers", tags=["organizers"])


@router.get("/me")
async def get_my_profile(organizer: CurrentOrganizer, session: DbSession):
    """The signed-in organizer's full profile."""
    return await profile_service.get_organizer_by_row(session, organizer)


@router.patch("/me")
async def update_my_profile(
    payload: OrganizerUpdate, organizer: CurrentOrganizer, session: DbSession
):
    return await profile_service.update_organizer(
        session, organizer, payload.model_dump(exclude_unset=True)
    )


@router.get("/me/summary")
async def get_my_summary(organizer: CurrentOrganizer):
    """Lightweight identity payload for the navbar."""
    return {
        "name": organizer.username,
        "profile_img": organizer.profile_img,
        "event_count": organizer.event_count,
        "rating": organizer.rating,
    }


@router.put("/me/profile-image")
async def update_profile_image(
    organizer: CurrentOrganizer,
    session: DbSession,
    file: Annotated[UploadFile, File(alias="profileImg")],
):
    """Replace the profile photo.

    Fixes the original handler, which looked up `req.user.id` (always
    undefined) and so 404'd on every upload.
    """
    url = await profile_service.set_organizer_image(
        session, organizer, kind="profile", data=await file.read()
    )
    return {"profile_img": url}


@router.put("/me/cover-image")
async def update_cover_image(
    organizer: CurrentOrganizer,
    session: DbSession,
    file: Annotated[UploadFile, File(alias="coverImage")],
):
    url = await profile_service.set_organizer_image(
        session, organizer, kind="cover", data=await file.read()
    )
    return {"cover_image": url}


@router.put("/me/experience")
async def set_experience(
    payload: list[ExperienceIn], organizer: CurrentOrganizer, session: DbSession
):
    """Replace the experience list."""
    await profile_service.set_experience(
        session, organizer, [item.model_dump() for item in payload]
    )
    return {"detail": "Experience updated"}


@router.put("/me/achievements")
async def set_achievements(
    payload: list[str], organizer: CurrentOrganizer, session: DbSession
):
    """Replace the achievements list."""
    await profile_service.set_achievements(session, organizer, payload)
    return {"detail": "Achievements updated"}


@router.get("/me/messages", status_code=status.HTTP_201_CREATED)
async def message_admin(
    payload: MessageSend, organizer: CurrentOrganizer, session: DbSession
):
    """Send a message to the admin team.

    Replaces `POST /api/organizer/messageAdmin`, which stored the recipient as
    the literal string "Admin" and could never be read back.
    """
    admin_ids = list((await session.scalars(select(Admin.id))).all())
    if not admin_ids:
        raise NotFoundError("No admin accounts exist yet", code="no_admins")

    for admin_id in admin_ids:
        await notification_service.notify(
            session,
            recipient_kind=RecipientKind.ADMIN,
            recipient_id=admin_id,
            sender_kind=NotificationSender.ORGANIZER,
            sender_id=organizer.id,
            sender_name=organizer.username,
            subject=payload.subject,
            message=payload.message,
        )
    await session.commit()
    return {"detail": "Message sent to the admin team", "recipients": len(admin_ids)}


@router.post("/me/broadcasts", response_model=BroadcastOut)
async def broadcast_to_attendees(
    payload: MessageSend, organizer: CurrentOrganizer, session: DbSession
):
    """Notify every attendee. Replaces /api/organizer/update-to-attendee."""
    count = await notification_service.broadcast(
        session,
        recipient_kind=RecipientKind.ATTENDEE,
        sender_kind=NotificationSender.ORGANIZER,
        sender_id=organizer.id,
        sender_name=organizer.username,
        subject=payload.subject,
        message=payload.message,
    )
    await session.commit()
    return BroadcastOut(recipients=count)


# --------------------------------------------------------------------------- #
# Admin-facing reads
# --------------------------------------------------------------------------- #


@router.get("", response_model=Page[OrganizerAdminOut])
async def list_organizers(
    admin: CurrentAdmin,
    session: DbSession,
    pagination: Annotated[PaginationParams, Depends(pagination_from_query)],
    search: Annotated[str | None, Query(max_length=120)] = None,
):
    """Browse organizers. Admin only.

    The original `DELETE /api/admin/deleteOrganizer?username=...` is gone:
    deletion now goes through `DELETE /api/admins/organizers/{id}` with the id
    in the path.
    """
    items, total = await profile_service.list_organizers(
        session,
        search=search,
        page=pagination.page,
        page_size=pagination.page_size,
    )
    return Page.build(
        items, page=pagination.page, page_size=pagination.page_size, total=total
    )


# NOTE: there is deliberately no GET /api/organizers/{organizer_id} here.
# It would shadow /api/organizers/notifications and /api/organizers/me/*
# depending on registration order. Admin-facing organizer detail lives at
# GET /api/admins/organizers/{organizer_id} instead.