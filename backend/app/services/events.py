"""Event queries and mutations.

All ownership checks live here, not in the routes: the original API let any
organizer read or mutate any event by guessing an id.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import BadRequestError, ConflictError, ForbiddenError, NotFoundError
from app.models.enums import EventStatus
from app.models.event import Event, EventRegistration
from app.models.user import Organizer
from app.schemas.event import (
    EventCreate,
    EventCriticalUpdate,
    EventUpdate,
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def complete_past_events(session: AsyncSession) -> int:
    """Mark approved events whose end_date has passed as completed.

    Runs on demand rather than only on the admin listing call, so the status is
    correct wherever it is read.
    """
    result = await session.execute(
        Event.__table__.update()
        .where(
            Event.__table__.c.end_date < _now(),
            Event.__table__.c.status == EventStatus.APPROVED.value,
        )
        .values(status=EventStatus.COMPLETED.value)
    )
    await session.commit()
    return result.rowcount or 0


async def get_event(session: AsyncSession, event_id: int) -> Event:
    event = await session.scalar(
        select(Event).options(selectinload(Event.organizer)).where(Event.id == event_id)
    )
    if event is None:
        raise NotFoundError("Event not found", code="event_not_found")
    return event


async def get_managed_event(
    session: AsyncSession, event_id: int, organizer: Organizer
) -> Event:
    """Fetch an event and assert the caller owns it."""
    event = await get_event(session, event_id)
    if event.organizer_id != organizer.id:
        # 404 rather than 403 so the endpoint does not confirm that someone
        # else's event exists.
        raise NotFoundError("Event not found", code="event_not_found")
    return event


async def list_public_events(
    session: AsyncSession,
    *,
    status_filter: EventStatus | None,
    search: str | None,
    category: str | None,
    page: int,
    page_size: int,
) -> tuple[list[Event], int]:
    """Approved, upcoming events visible on the public site."""
    stmt: Select = select(Event).where(
        Event.status == EventStatus.APPROVED, Event.start_date > _now()
    )
    count_stmt = select(func.count(Event.id)).where(
        Event.status == EventStatus.APPROVED, Event.start_date > _now()
    )
    if status_filter is not None:
        stmt = stmt.where(Event.status == status_filter)
        count_stmt = count_stmt.where(Event.status == status_filter)
    if category:
        stmt = stmt.where(func.lower(Event.category) == category.lower())
        count_stmt = count_stmt.where(func.lower(Event.category) == category.lower())
    if search:
        pattern = f"%{search.lower()}%"
        clause = or_(
            func.lower(Event.event_name).like(pattern),
            func.lower(Event.category).like(pattern),
            func.array_to_string(Event.speakers, " ").ilike(f"%{search}%"),
            func.lower(func.coalesce(Event.description, "")).like(pattern),
        )
        stmt = stmt.where(clause)
        count_stmt = count_stmt.where(clause)

    stmt = (
        stmt.order_by(Event.start_date.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    total = await session.scalar(count_stmt) or 0
    events = list((await session.scalars(stmt)).all())
    return events, total


async def list_events_by_status(
    session: AsyncSession,
    *,
    status_filter: EventStatus,
    search: str | None,
    page: int,
    page_size: int,
) -> tuple[list[Event], int]:
    """Admin listing across every status."""
    base = [Event.status == status_filter]
    count_stmt = select(func.count(Event.id)).where(*base)
    stmt = select(Event).options(selectinload(Event.organizer)).where(*base)

    if search:
        pattern = f"%{search}%"
        clause = or_(
            func.lower(Event.event_name).like(pattern),
            func.lower(Event.category).like(pattern),
        )
        stmt = stmt.where(clause)
        count_stmt = count_stmt.where(clause)

    total = await session.scalar(count_stmt) or 0
    stmt = (
        stmt.order_by(Event.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list((await session.scalars(stmt)).all()), total


async def list_organizer_events(
    session: AsyncSession,
    organizer: Organizer,
    *,
    status_filter: EventStatus | None,
    page: int,
    page_size: int,
) -> tuple[list[Event], int]:
    base = [Event.organizer_id == organizer.id]
    if status_filter is not None:
        base.append(Event.status == status_filter)
    count_stmt = select(func.count(Event.id)).where(*base)
    stmt = (
        select(Event)
        .options(selectinload(Event.organizer))
        .where(*base)
        .order_by(Event.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    total = await session.scalar(count_stmt) or 0
    return list((await session.scalars(stmt)).all()), total


async def create_event(
    session: AsyncSession, organizer: Organizer, payload: EventCreate
) -> Event:
    address = payload.address
    event = Event(
        event_name=payload.event_name,
        category=payload.category,
        description=payload.description,
        start_date=payload.start_date,
        end_date=payload.end_date,
        venue=payload.venue,
        street=address.street,
        city=address.city,
        state=address.state,
        postal_code=address.postal_code,
        country=address.country,
        event_type=payload.event_type,
        tickets_required=payload.tickets_required,
        price=payload.price,
        max_attendees=payload.max_attendees,
        speakers=list(payload.speakers),
        services=list(payload.services),
        sponsors=list(payload.sponsors),
        status=EventStatus.PENDING,
        organizer_id=organizer.id,
    )
    session.add(event)
    organizer.event_count = (organizer.event_count or 0) + 1
    await session.commit()
    await session.refresh(event)
    return event


async def update_event(
    session: AsyncSession,
    event: Event,
    organizer: Organizer,
    payload: EventUpdate,
) -> Event:
    data = payload.model_dump(exclude_unset=True)
    address = data.pop("address", None)
    for key, value in data.items():
        if hasattr(event, key):
            setattr(event, key, value)
    if address:
        event.street = address["street"]
        event.city = address["city"]
        event.state = address["state"]
        event.postal_code = address["postal_code"]
        event.country = address["country"]

    max_attendees = data.get("max_attendees")
    if max_attendees is not None and max_attendees < event.current_attendees:
        raise ConflictError(
            f"Cannot lower capacity below the {event.current_attendees} "
            "attendees already registered",
            code="capacity_below_registered",
        )

    await session.commit()
    await session.refresh(event)
    return event


async def update_event_critical(
    session: AsyncSession, event: Event, payload: EventCriticalUpdate
) -> tuple[Event, str | None]:
    """Apply schedule/location changes and return a notice for attendees."""
    data = payload.model_dump(exclude_unset=True)
    address = data.pop("address", None)
    notify = data.pop("notify_attendees", True)

    notice: str | None = None

    if payload.start_date and payload.end_date:
        shortened = (payload.end_date - payload.start_date).total_seconds() / 3600
        event.start_date = payload.start_date
        event.end_date = payload.end_date
        if shortened < 3:
            notice = (
                f"The event is delayed by about {shortened:.1f} hours. "
                "We apologise for the inconvenience."
            )
            event.roar = notice
        else:
            notice = "The event schedule has been updated."
    elif payload.start_date:
        if payload.start_date >= event.end_date:
            raise BadRequestError("start_date must be before the current end_date")
        event.start_date = payload.start_date
    elif payload.end_date:
        if payload.end_date <= event.start_date:
            raise BadRequestError("end_date must be after the current start_date")
        event.end_date = payload.end_date

    if payload.venue:
        event.venue = payload.venue
    if address:
        event.street = address["street"]
        event.city = address["city"]
        event.state = address["state"]
        event.postal_code = address["postal_code"]
        event.country = address["country"]
    if payload.max_attendees is not None:
        if payload.max_attendees > event.max_attendees:
            event.max_attendees = payload.max_attendees
        elif payload.max_attendees < event.current_attendees:
            raise ConflictError(
                "Cannot reduce capacity below the number already registered",
                code="capacity_below_registered",
            )

    await session.commit()
    await session.refresh(event)
    return event, notice if notify else None


async def set_event_tags(
    session: AsyncSession,
    event: Event,
    *,
    speakers: list[str] | None,
    services: list[str] | None,
    sponsors: list[str] | None,
    roar: str | None,
) -> Event:
    """Union-merge tag lists, matching the original append-and-dedupe intent."""
    for field, incoming in (
        ("speakers", speakers),
        ("services", services),
        ("sponsors", sponsors),
    ):
        if incoming is not None:
            existing = list(getattr(event, field) or [])
            setattr(event, field, list(dict.fromkeys([*existing, *incoming])))
    if roar is not None:
        event.roar = roar
    await session.commit()
    await session.refresh(event)
    return event


async def approve_event(session: AsyncSession, event: Event, admin_id: int) -> Event:
    if event.status is EventStatus.APPROVED:
        raise ConflictError("Event is already approved", code="already_approved")
    if event.status is EventStatus.CANCELLED:
        raise ConflictError("A cancelled event cannot be approved", code="already_cancelled")
    event.status = EventStatus.APPROVED
    event.approved_by_id = admin_id
    await session.commit()
    await session.refresh(event)
    return event


async def cancel_event(
    session: AsyncSession, event: Event, admin_id: int, reason: str
) -> Event:
    if event.status is EventStatus.CANCELLED:
        raise ConflictError("Event is already cancelled", code="already_cancelled")
    event.status = EventStatus.CANCELLED
    event.cancelled_by_id = admin_id
    event.cancellation_reason = reason
    event.cancelled_at = _now()
    event.roar = "This event has been cancelled."
    await session.commit()
    await session.refresh(event)
    return event


async def registered_attendee_ids(session: AsyncSession, event_id: int) -> list[int]:
    """Ids of everyone registered, for a broadcast notice."""
    return list(
        (
            await session.scalars(
                select(EventRegistration.attendee_id).where(
                    EventRegistration.event_id == event_id
                )
            )
        ).all()
    )


async def is_registered(session: AsyncSession, event_id: int, attendee_id: int) -> bool:
    return (
        await session.scalar(
            select(func.count(EventRegistration.id)).where(
                EventRegistration.event_id == event_id,
                EventRegistration.attendee_id == attendee_id,
            )
        )
    ) > 0


async def list_attendee_registrations(
    session: AsyncSession, attendee_id: int
) -> list[tuple[EventRegistration, Event]]:
    """Return (registration, event) pairs for an attendee's registrations.

    The registration id is included because withdrawing is keyed on the
    registration rather than the event: an attendee can register again for the
    same event after cancelling, so the event id alone is ambiguous.
    """
    rows = (
        await session.execute(
            select(EventRegistration, Event)
            .join(Event, Event.id == EventRegistration.event_id)
            .where(EventRegistration.attendee_id == attendee_id)
            .options(selectinload(Event.organizer))
            .order_by(Event.start_date.desc())
        )
    ).all()
    return [(row[0], row[1]) for row in rows]


async def delete_organizer_events(session: AsyncSession, organizer_id: int) -> None:
    await session.execute(
        Event.__table__.delete().where(Event.__table__.c.organizer_id == organizer_id)
    )