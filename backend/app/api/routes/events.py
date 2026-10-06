"""Event routes.

Path redesign from the original:

    POST /api/organizer/create-event              -> POST   /api/events
    GET  /api/organizer/events                    -> GET    /api/events/mine
    GET  /api/organizer/event/:id                 -> GET    /api/events/{id}
    PUT  /api/organizer/event/update-event-banner  -> PUT    /api/events/{id}/banner
    PUT  /api/organizer/update/simple/:id          -> PATCH  /api/events/{id}/tags
    PUT  /api/organizer/update/critical/:id        -> PATCH  /api/events/{id}/schedule
    POST /api/admin/:id/ApproveEvent              -> POST   /api/events/{id}/approval
    POST /api/admin/:id/CancelEvent               -> POST   /api/events/{id}/cancellation
    GET  /api/admin/approve-pending-events        -> GET    /api/events?status=pending
"""

from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, File, Query, Request, Response, UploadFile, status

from app.api.deps.auth import CurrentAdmin, CurrentOrganizer, DbSession, resolve_session
from app.core.cloudinary import upload_image
from app.core.errors import ConflictError
from app.models.enums import EventStatus, NotificationSender, UserRole
from app.models.notification import RecipientKind
from app.schemas.common import Page, PaginationParams, pagination_from_query
from app.schemas.event import (
    CancellationRequest,
    EventCreate,
    EventCriticalUpdate,
    EventDetailOut,
    EventOut,
    EventTagUpdate,
    EventUpdate,
)
from app.models.user import Attendee
from app.services import events as event_service
from app.services import notifications as notification_service

router = APIRouter(prefix="/api/events", tags=["events"])


async def optional_attendee(request: Request, session: DbSession) -> Attendee | None:
    """Resolve an attendee if one is signed in, else None.

    Distinct from `get_current_attendee`, which rejects anonymous callers. This
    backs the public event detail page, which an attendee token enriches but is
    not required for. A token belonging to another role is ignored rather than
    treated as an error.
    """
    try:
        user_id, role = await resolve_session(request, session)
    except Exception:  # noqa: BLE001 - anonymous access is expected here
        return None
    if role is not UserRole.ATTENDEE:
        return None
    return await session.get(Attendee, user_id)


OptionalAttendee = Annotated[Optional[Attendee], Depends(optional_attendee)]


@router.get("", response_model=Page[EventOut])
async def list_events(
    session: DbSession,
    pagination: Annotated[PaginationParams, Depends(pagination_from_query)],
    status_filter: Annotated[
        EventStatus | None,
        Query(alias="status"),
    ] = None,
    search: Annotated[str | None, Query(max_length=120)] = None,
    category: Annotated[str | None, Query(max_length=120)] = None,
):
    """Approved upcoming events. Public."""
    await event_service.complete_past_events(session)
    items, total = await event_service.list_public_events(
        session,
        status_filter=status_filter,
        search=search,
        category=category,
        page=pagination.page,
        page_size=pagination.page_size,
    )
    return Page.build(
        items, page=pagination.page, page_size=pagination.page_size, total=total
    )


@router.get("/mine", response_model=Page[EventOut])
async def list_my_events(
    organizer: CurrentOrganizer,
    session: DbSession,
    pagination: Annotated[PaginationParams, Depends(pagination_from_query)],
    status_filter: Annotated[
        EventStatus | None,
        Query(alias="status"),
    ] = None,
):
    """Events owned by the signed-in organizer."""
    items, total = await event_service.list_organizer_events(
        session,
        organizer,
        status_filter=status_filter,
        page=pagination.page,
        page_size=pagination.page_size,
    )
    return Page.build(
        items, page=pagination.page, page_size=pagination.page_size, total=total
    )


@router.post("", response_model=EventOut, status_code=status.HTTP_201_CREATED)
async def create_event(
    payload: EventCreate, organizer: CurrentOrganizer, session: DbSession
):
    """Create an event. It starts pending and awaits admin approval."""
    event = await event_service.create_event(session, organizer, payload)
    await notification_service.notify(
        session,
        recipient_kind=RecipientKind.ORGANIZER,
        recipient_id=organizer.id,
        sender_kind=NotificationSender.SYSTEM,
        sender_id=None,
        sender_name="EventSphere",
        subject=f"{event.event_name} - created successfully",
        message=(
            "Your event has been created and is awaiting approval. Attendees will "
            "be able to see it once an admin approves it."
        ),
    )
    await session.commit()
    return event


@router.get("/{event_id}", response_model=EventDetailOut)
async def get_event_detail(
    event_id: int,
    session: DbSession,
    request: Request,
    attendee: OptionalAttendee = None,
):
    """Event detail with the caller's registration state.

    Open to signed-out visitors. An attendee sees their real registration
    state; anyone else sees false. The optional dependency resolves to None
    rather than 401 when there is no valid attendee token.
    """
    event = await event_service.get_event(session, event_id)
    registered = (
        await event_service.is_registered(session, event_id, attendee.id)
        if attendee is not None
        else False
    )
    return EventDetailOut(
        **EventOut.model_validate(event).model_dump(),
        is_registered=registered,
        organizer_username=event.organizer.username if event.organizer else None,
    )


@router.patch("/{event_id}", response_model=EventOut)
async def update_event(
    event_id: int, payload: EventUpdate, organizer: CurrentOrganizer, session: DbSession
):
    """Update the non-critical fields of an event you own."""
    event = await event_service.get_managed_event(session, event_id, organizer)
    return await event_service.update_event(session, event, organizer, payload)


@router.patch("/{event_id}/tags", response_model=EventOut)
async def update_event_tags(
    event_id: int, payload: EventTagUpdate, organizer: CurrentOrganizer, session: DbSession
):
    """Merge speakers, services and sponsors onto an event you own."""
    event = await event_service.get_managed_event(session, event_id, organizer)
    return await event_service.set_event_tags(
        session,
        event,
        speakers=payload.speakers,
        services=payload.services,
        sponsors=payload.sponsors,
        roar=payload.roar,
    )


@router.patch("/{event_id}/schedule", response_model=EventOut)
async def update_event_schedule(
    event_id: int,
    payload: EventCriticalUpdate,
    organizer: CurrentOrganizer,
    session: DbSession,
):
    """Change dates or venue. Notifies registered attendees by default."""
    event = await event_service.get_managed_event(session, event_id, organizer)
    event, notice = await event_service.update_event_critical(session, event, payload)
    if notice:
        for attendee_id in await event_service.registered_attendee_ids(session, event.id):
            await notification_service.notify(
                session,
                recipient_kind=RecipientKind.ATTENDEE,
                recipient_id=attendee_id,
                sender_kind=NotificationSender.ORGANIZER,
                sender_id=organizer.id,
                sender_name=organizer.username,
                subject=f"Update to {event.event_name}",
                message=notice,
            )
        await session.commit()
    return event


@router.put("/{event_id}/banner", response_model=EventOut)
async def update_event_banner(
    event_id: int,
    organizer: CurrentOrganizer,
    session: DbSession,
    file: Annotated[UploadFile, File(alias="banner")],
):
    """Replace an event's banner image."""
    event = await event_service.get_managed_event(session, event_id, organizer)
    event.banner = await upload_image(await file.read(), kind="banner")
    await session.commit()
    await session.refresh(event)
    return event


@router.post("/{event_id}/approval", response_model=EventOut)
async def approve_event(event_id: int, admin: CurrentAdmin, session: DbSession):
    """Approve a pending event and notify its organizer."""
    event = await event_service.get_event(session, event_id)
    event = await event_service.approve_event(session, event, admin.id)
    await notification_service.notify(
        session,
        recipient_kind=RecipientKind.ORGANIZER,
        recipient_id=event.organizer_id,
        sender_kind=NotificationSender.ADMIN,
        sender_id=admin.id,
        sender_name=admin.username,
        subject=f'Your event request for "{event.event_name}" has been approved',
        message=(
            f'We are pleased to inform you that "{event.event_name}" scheduled for '
            f"{event.start_date:%d %B %Y} has been approved. Attendees can now "
            "register."
        ),
    )
    await session.commit()
    return event


@router.post("/{event_id}/cancellation", response_model=EventOut)
async def cancel_event(
    event_id: int,
    payload: CancellationRequest,
    admin: CurrentAdmin,
    session: DbSession,
):
    """Cancel an event and notify its organizer.

    Replaces the original handler, which referenced undefined variables and
    returned 500 on every call.
    """
    event = await event_service.get_event(session, event_id)
    event = await event_service.cancel_event(session, event, admin.id, payload.reason)
    await notification_service.notify(
        session,
        recipient_kind=RecipientKind.ORGANIZER,
        recipient_id=event.organizer_id,
        sender_kind=NotificationSender.ADMIN,
        sender_id=admin.id,
        sender_name=admin.username,
        subject=f'Your event "{event.event_name}" has been cancelled',
        message=(
            f'Dear {event.organizer.username if event.organizer else "Organizer"},\n\n'
            f'We regret to inform you that "{event.event_name}" has been cancelled. '
            f"Reason: {payload.reason}\n\nRegistered attendees have been notified and "
            "are entitled to a full refund.\n\nBest regards,\nEventSphere"
        ),
    )
    await session.commit()
    return event


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: int, organizer: CurrentOrganizer, session: DbSession
):
    """Delete an event you own. Cancelled events only, to protect attendees."""
    event = await event_service.get_managed_event(session, event_id, organizer)
    if event.status is not EventStatus.CANCELLED:
        raise ConflictError(
            "Only cancelled events can be deleted", code="event_not_cancelled"
        )
    await session.delete(event)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)