"""Notification routes for all three roles.

Replaces nine hand-written handlers (three per role) that each queried a
different collection with a different response shape.

Path redesign:

    GET /api/{role}/notifications            -> GET /api/{role}/notifications
    GET /api/{role}/notification/:id         -> GET /api/{role}/notifications/{id}
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps.auth import CurrentAdmin, CurrentAttendee, CurrentOrganizer, DbSession
from app.models.notification import RecipientKind
from app.schemas.event import NotificationPage
from app.services import notifications as notification_service

attendee_router = APIRouter(prefix="/api/attendees", tags=["notifications"])
organizer_router = APIRouter(prefix="/api/organizers", tags=["notifications"])
admin_router = APIRouter(prefix="/api/admins", tags=["notifications"])


def _page(items, total, page: int, page_size: int) -> NotificationPage:
    return NotificationPage(
        items=items,
        page=page,
        page_size=page_size,
        total=total,
        total_pages=(total + page_size - 1) // page_size if page_size else 0,
    )


@attendee_router.get("/notifications", response_model=NotificationPage)
async def attendee_notifications(
    attendee: CurrentAttendee,
    session: DbSession,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    unread_only: Annotated[bool, Query()] = False,
):
    items, total = await notification_service.list_notifications(
        session,
        recipient_kind=RecipientKind.ATTENDEE,
        recipient_id=attendee.id,
        page=page,
        page_size=page_size,
        unread_only=unread_only,
    )
    return _page(items, total, page, page_size)


@attendee_router.get("/notifications/{notification_id}")
async def attendee_notification(
    notification_id: int, attendee: CurrentAttendee, session: DbSession
):
    return await notification_service.get_notification(
        session,
        notification_id=notification_id,
        recipient_kind=RecipientKind.ATTENDEE,
        recipient_id=attendee.id,
    )


@attendee_router.post("/notifications/{notification_id}/read")
async def attendee_read(
    notification_id: int, attendee: CurrentAttendee, session: DbSession
):
    return await notification_service.mark_read(
        session,
        notification_id=notification_id,
        recipient_kind=RecipientKind.ATTENDEE,
        recipient_id=attendee.id,
    )


@organizer_router.get("/notifications", response_model=NotificationPage)
async def organizer_notifications(
    organizer: CurrentOrganizer,
    session: DbSession,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    unread_only: Annotated[bool, Query()] = False,
):
    """The organizer's own inbox.

    Fixed: the original called `.find()` with no filter, returning every
    notification in the collection to any organizer who asked.
    """
    items, total = await notification_service.list_notifications(
        session,
        recipient_kind=RecipientKind.ORGANIZER,
        recipient_id=organizer.id,
        page=page,
        page_size=page_size,
        unread_only=unread_only,
    )
    return _page(items, total, page, page_size)


@organizer_router.get("/notifications/{notification_id}")
async def organizer_notification(
    notification_id: int, organizer: CurrentOrganizer, session: DbSession
):
    return await notification_service.get_notification(
        session,
        notification_id=notification_id,
        recipient_kind=RecipientKind.ORGANIZER,
        recipient_id=organizer.id,
    )


@organizer_router.post("/notifications/{notification_id}/read")
async def organizer_read(
    notification_id: int, organizer: CurrentOrganizer, session: DbSession
):
    return await notification_service.mark_read(
        session,
        notification_id=notification_id,
        recipient_kind=RecipientKind.ORGANIZER,
        recipient_id=organizer.id,
    )


@admin_router.get("/notifications", response_model=NotificationPage)
async def admin_notifications(
    admin: CurrentAdmin,
    session: DbSession,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    unread_only: Annotated[bool, Query()] = False,
):
    items, total = await notification_service.list_notifications(
        session,
        recipient_kind=RecipientKind.ADMIN,
        recipient_id=admin.id,
        page=page,
        page_size=page_size,
        unread_only=unread_only,
    )
    return _page(items, total, page, page_size)


@admin_router.get("/notifications/{notification_id}")
async def admin_notification(
    notification_id: int, admin: CurrentAdmin, session: DbSession
):
    return await notification_service.get_notification(
        session,
        notification_id=notification_id,
        recipient_kind=RecipientKind.ADMIN,
        recipient_id=admin.id,
    )


@admin_router.post("/notifications/{notification_id}/read")
async def admin_read(
    notification_id: int, admin: CurrentAdmin, session: DbSession
):
    return await notification_service.mark_read(
        session,
        notification_id=notification_id,
        recipient_kind=RecipientKind.ADMIN,
        recipient_id=admin.id,
    )