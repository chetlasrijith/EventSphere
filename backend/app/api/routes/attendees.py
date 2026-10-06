"""Attendee routes.

Path redesign:

    GET  /api/attendee/profile            -> GET  /api/attendees/me
    PUT  /api/attendee/profileUpdate      -> PATCH /api/attendees/me
    PUT  /api/attendee/profileImageUpdate -> PUT  /api/attendees/me/profile-image
    GET  /api/attendee/getName            -> GET  /api/attendees/me/summary
    GET  /api/attendee/event-list         -> GET  /api/events
    GET  /api/attendee/myevent-list       -> GET  /api/attendees/me/registrations
    GET  /api/attendee/getevent/:id       -> GET  /api/events/{id}
    GET  /api/attendee/search             -> GET  /api/events?search=
    POST /api/attendee/events/:id/register-> POST /api/events/{id}/registrations
    POST /api/attendee/storeticket        -> POST /api/events/{id}/ticket
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, File, Query, UploadFile, status

from app.api.deps.auth import CurrentAttendee, DbSession
from app.core.errors import NotFoundError
from app.schemas.event import (
    EventOut,
    RegistrationCreated,
    RegistrationOut,
    RegistrationWithEvent,
    TicketOut,
    TicketRequest,
)
from app.schemas.user import AttendeeOut, AttendeeUpdate
from app.services import events as event_service
from app.services import profiles as profile_service
from app.services import registrations as registration_service

router = APIRouter(prefix="/api/attendees", tags=["attendees"])


@router.get("/me", response_model=AttendeeOut)
async def get_profile(attendee: CurrentAttendee):
    """The signed-in attendee's own profile."""
    return attendee


@router.patch("/me", response_model=AttendeeOut)
async def update_profile(
    payload: AttendeeUpdate, attendee: CurrentAttendee, session: DbSession
):
    return await profile_service.update_attendee(
        session, attendee, payload.model_dump(exclude_unset=True)
    )


@router.put("/me/profile-image", response_model=AttendeeOut)
async def update_profile_image(
    attendee: CurrentAttendee,
    session: DbSession,
    file: Annotated[UploadFile, File(alias="profileImg")],
):
    return await profile_service.set_attendee_profile_image(
        session, attendee, await file.read()
    )


@router.get("/me/summary")
async def get_summary(attendee: CurrentAttendee):
    """Lightweight identity payload for the navbar."""
    return {
        "name": attendee.username,
        "profile_img": attendee.profile_img,
        "registration_count": len(attendee.registrations),
    }


@router.get("/me/registrations", response_model=list[RegistrationWithEvent])
async def my_registrations(attendee: CurrentAttendee, session: DbSession):
    """The attendee's registrations, each with its event.

    Returning registration_id lets the client withdraw precisely, without
    having to search for the registration by event id.
    """
    pairs = await event_service.list_attendee_registrations(session, attendee.id)
    return [
        RegistrationWithEvent(
            registration_id=registration.id,
            registered_at=registration.created_at,
            event=EventOut.model_validate(event),
        )
        for registration, event in pairs
    ]


@router.get("/me/tickets", response_model=list[TicketOut])
async def my_tickets(attendee: CurrentAttendee, session: DbSession):
    return await registration_service.list_tickets(session, attendee)


@router.post(
    "/me/registrations/{event_id}",
    response_model=RegistrationCreated,
    status_code=status.HTTP_201_CREATED,
)
async def register_for_event(
    event_id: int, attendee: CurrentAttendee, session: DbSession
):
    """Register for an event.

    Capacity is enforced under a row lock, and a unique constraint prevents
    duplicate registrations.
    """
    registration = await registration_service.register_for_event(
        session, event_id=event_id, attendee=attendee
    )
    event = await event_service.get_event(session, event_id)
    return RegistrationCreated(
        registration=RegistrationOut(
            id=registration.id,
            event_id=registration.event_id,
            attendee_id=registration.attendee_id,
            created_at=registration.created_at,
        ),
        event=EventOut.model_validate(event),
    )


@router.delete(
    "/me/registrations/{registration_id}",
    response_model=EventOut,
)
async def cancel_registration(
    registration_id: int, attendee: CurrentAttendee, session: DbSession
):
    """Withdraw from an event, releasing its capacity and voiding the ticket."""
    event = await registration_service.cancel_registration(
        session, registration_id=registration_id, attendee=attendee
    )
    return event


@router.post("/me/tickets", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
async def issue_ticket(
    payload: TicketRequest, attendee: CurrentAttendee, session: DbSession
):
    """Issue a ticket for a confirmed registration.

    Booking id and secret code are generated server-side; the client no longer
    supplies them. Idempotent: requesting a ticket twice returns the existing
    one rather than erroring.
    """
    return await registration_service.issue_ticket(
        session, event_id=payload.event_id, attendee=attendee
    )