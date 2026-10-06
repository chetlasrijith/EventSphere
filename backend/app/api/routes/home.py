"""Public homepage endpoints.

Replaces /api/home/banners, /api/home/events and /api/home/eventDetails/:id.

The original formatted dates and locations server-side into display strings
("March 5, 2026"), which the React components then had to render raw. Dates are
now returned as ISO 8601 and formatting happens in the browser, where locale
and timezone are the viewer's rather than the server's.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps.auth import DbSession
from app.schemas.common import APIModel
from app.schemas.event import EventCard
from app.services import events as event_service

router = APIRouter(prefix="/api/home", tags=["home"])


class HeroBanner(APIModel):
    """Compact banner shape for the hero carousel."""

    id: int
    image: str
    title: str
    start_date: datetime
    city: str


@router.get("/banners", response_model=list[HeroBanner])
async def get_banners(
    session: DbSession,
    limit: Annotated[int, Query(ge=1, le=20)] = 5,
):
    """The next few approved events, for the homepage hero carousel."""
    events, _ = await event_service.list_public_events(
        session,
        status_filter=None,
        search=None,
        category=None,
        page=1,
        page_size=limit,
    )
    return [
        HeroBanner(
            id=event.id,
            image=event.banner,
            title=event.event_name,
            start_date=event.start_date,
            city=event.city,
        )
        for event in events
    ]


@router.get("/events", response_model=list[EventCard])
async def get_featured_events(
    session: DbSession,
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
    category: Annotated[str | None, Query(max_length=120)] = None,
):
    """Soonest upcoming approved events, for the homepage grid."""
    events, _ = await event_service.list_public_events(
        session,
        status_filter=None,
        search=None,
        category=category,
        page=1,
        page_size=limit,
    )
    return events


@router.get("/stats")
async def get_stats(session: DbSession):
    """Headline counts for the homepage."""
    from sqlalchemy import func, select

    from app.models.enums import EventStatus
    from app.models.event import Event

    now = datetime.now(timezone.utc)
    total_events = await session.scalar(select(func.count(Event.id))) or 0
    upcoming = (
        await session.scalar(
            select(func.count(Event.id)).where(
                Event.status == EventStatus.APPROVED, Event.start_date > now
            )
        )
        or 0
    )
    return {"total_events": total_events, "upcoming_events": upcoming}