"""Registration and ticket creation.

The original flow read currentAttendees, compared to maxAttendees, inserted, then
incremented -- three separate round trips with no locking. Two concurrent
requests could both pass the capacity check and oversell the event. Here the
event row is locked FOR UPDATE for the whole transaction, and a unique
constraint on (event_id, attendee_id) makes duplicates impossible at the
database level.
"""

from __future__ import annotations

import secrets
import string

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import BadRequestError, ConflictError, NotFoundError
from app.models.enums import EventStatus
from app.models.event import Event, EventRegistration, Ticket
from app.models.user import Attendee


async def register_for_event(
    session: AsyncSession, *, event_id: int, attendee: Attendee
) -> EventRegistration:
    # Serialise concurrent registrations for this event.
    # `of=Event` matters: Event.organizer is lazy="joined", so without it the
    # query carries a LEFT OUTER JOIN and Postgres refuses to apply FOR UPDATE
    # to the nullable side of it.
    event = await session.scalar(
        select(Event).where(Event.id == event_id).with_for_update(of=Event)
    )
    if event is None:
        raise NotFoundError("Event not found", code="event_not_found")
    if event.status is not EventStatus.APPROVED:
        raise ConflictError(
            "This event is not open for registration", code="event_not_open"
        )
    if event.current_attendees >= event.max_attendees:
        raise ConflictError("All the bookings are completed", code="event_full")

    already = await session.scalar(
        select(func.count(EventRegistration.id)).where(
            EventRegistration.event_id == event_id,
            EventRegistration.attendee_id == attendee.id,
        )
    )
    if already:
        raise ConflictError(
            "You are already registered for this event", code="already_registered"
        )

    registration = EventRegistration(event_id=event_id, attendee_id=attendee.id)
    session.add(registration)
    event.current_attendees += 1

    try:
        await session.commit()
    except IntegrityError as exc:
        # Lost the race against a concurrent request despite the row lock.
        await session.rollback()
        raise ConflictError(
            "You are already registered for this event", code="already_registered"
        ) from exc

    await session.refresh(registration)
    return registration


async def cancel_registration(
    session: AsyncSession, *, registration_id: int, attendee: Attendee
) -> Event:
    """Withdraw from an event, releasing its capacity.

    Also deletes the issued ticket, since it is no longer valid.
    """
    registration = await session.scalar(
        select(EventRegistration)
        .where(EventRegistration.id == registration_id)
        .options(selectinload(EventRegistration.event))
        .with_for_update(of=EventRegistration)
    )
    if registration is None:
        raise NotFoundError("Registration not found", code="registration_not_found")
    if registration.attendee_id != attendee.id:
        raise NotFoundError(
            "Registration not found", code="registration_not_found"
        )
    if registration.event.status is EventStatus.COMPLETED:
        raise ConflictError(
            "This event has already taken place", code="event_completed"
        )

    event = await session.scalar(
        select(Event).where(Event.id == registration.event_id).with_for_update(of=Event)
    )
    if event is None:
        raise NotFoundError("Event not found", code="event_not_found")

    await session.execute(
        Ticket.__table__.delete().where(
            Ticket.__table__.c.event_id == registration.event_id,
            Ticket.__table__.c.attendee_id == attendee.id,
        )
    )
    await session.delete(registration)
    event.current_attendees = max(event.current_attendees - 1, 0)
    await session.commit()
    await session.refresh(event)
    return event


def _generate(length: int, *, alphabet: str) -> str:
    return "".join(secrets.choice(alphabet) for _ in range(length))


# string.ascii_letters is the human-readable alphabet; secrets only offers choice()
_SECRET_ALPHABET = string.ascii_letters + string.digits


async def issue_ticket(
    session: AsyncSession, *, event_id: int, attendee: Attendee
) -> Ticket:
    """Issue a ticket for a confirmed registration.

    Booking id and secret code are generated here rather than accepted from the
    client. The frontend used to mint both in the browser, so any user could
    POST an arbitrary booking id.
    """
    registration = await session.scalar(
        select(EventRegistration).where(
            EventRegistration.event_id == event_id,
            EventRegistration.attendee_id == attendee.id,
        )
    )
    if registration is None:
        raise BadRequestError(
            "Register for the event before generating a ticket",
            code="registration_required",
        )

    existing = await session.scalar(
        select(Ticket).where(
            Ticket.event_id == event_id, Ticket.attendee_id == attendee.id
        )
    )
    if existing is not None:
        # One ticket per registration; return the existing one so a double
        # submit is idempotent rather than an error.
        return existing

    secret_code = _generate(8, alphabet=_SECRET_ALPHABET)
    booking_id = _generate(15, alphabet=string.digits)
    ticket = Ticket(
        event_id=event_id,
        attendee_id=attendee.id,
        booking_id=booking_id,
        secret_code=secret_code,
        qr_code_value=f"{event_id}_{secret_code}",
    )
    session.add(ticket)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise ConflictError(
            "A ticket already exists for this event", code="ticket_exists"
        ) from exc
    await session.refresh(ticket)
    return ticket


async def list_tickets(session: AsyncSession, attendee: Attendee) -> list[Ticket]:
    return list(
        (
            await session.scalars(
                select(Ticket)
                .where(Ticket.attendee_id == attendee.id)
                .order_by(Ticket.created_at.desc())
            )
        ).all()
    )