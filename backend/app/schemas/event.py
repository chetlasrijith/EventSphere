"""Event, registration, ticket, and notification schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, Field, computed_field, model_validator

from app.models.enums import EventStatus, EventType, NotificationSender
from app.models.notification import RecipientKind
from app.schemas.common import APIModel, ORMModel, Page

TagList = Annotated[list[str], Field(max_length=50)]


# --------------------------------------------------------------------------- #
# Address
# --------------------------------------------------------------------------- #


class EventAddress(APIModel):
    street: str = Field(min_length=1, max_length=255)
    city: str = Field(min_length=1, max_length=120)
    state: str = Field(min_length=1, max_length=120)
    postal_code: str = Field(min_length=1, max_length=20)
    country: str = Field(min_length=1, max_length=120)


# --------------------------------------------------------------------------- #
# Event
# --------------------------------------------------------------------------- #


class EventCreate(APIModel):
    event_name: str = Field(min_length=3, max_length=200)
    category: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=5000)
    start_date: datetime
    end_date: datetime
    venue: str = Field(min_length=1, max_length=255)
    address: EventAddress
    event_type: EventType = EventType.PUBLIC
    tickets_required: bool = False
    price: float = Field(default=0, ge=0)
    max_attendees: int = Field(ge=1)
    speakers: TagList = Field(default_factory=list)
    services: TagList = Field(default_factory=list)
    sponsors: TagList = Field(default_factory=list)

    @model_validator(mode="after")
    def _validate_dates(self) -> "EventCreate":
        if self.end_date <= self.start_date:
            raise ValueError("end_date must be after start_date")
        return self


class EventUpdate(APIModel):
    """Full update of the fields an organizer may change freely."""

    category: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=5000)
    venue: str | None = Field(default=None, min_length=1, max_length=255)
    address: EventAddress | None = None
    event_type: EventType | None = None
    price: float | None = Field(default=None, ge=0)
    # Raising the cap is allowed; lowering it below current_attendees is not,
    # and is enforced in the service where the current count is known.
    max_attendees: int | None = Field(default=None, ge=1)


class EventTagUpdate(APIModel):
    """Merge speakers, services and sponsors onto an event."""

    speakers: TagList | None = None
    services: TagList | None = None
    sponsors: TagList | None = None
    roar: str | None = Field(default=None, max_length=500)


class EventCriticalUpdate(APIModel):
    """Schedule and location changes.

    Split from EventUpdate because these invalidate existing bookings: a
    shortened window triggers a refund notice, per the original policy.
    """

    start_date: datetime | None = None
    end_date: datetime | None = None
    venue: str | None = Field(default=None, min_length=1, max_length=255)
    address: EventAddress | None = None
    max_attendees: int | None = Field(default=None, ge=1)
    notify_attendees: bool = True

    @model_validator(mode="after")
    def _validate_window(self) -> "EventCriticalUpdate":
        if self.start_date and self.end_date and self.end_date <= self.start_date:
            raise ValueError("end_date must be after start_date")
        return self


class EventOut(ORMModel):
    id: int
    event_name: str
    category: str
    description: str | None
    start_date: datetime
    end_date: datetime
    venue: str
    street: str
    city: str
    state: str
    postal_code: str
    country: str
    event_type: EventType
    tickets_required: bool
    price: float
    max_attendees: int
    current_attendees: int
    banner: str
    speakers: list[str]
    services: list[str]
    sponsors: list[str]
    status: EventStatus
    roar: str
    organizer_id: int
    cancellation_reason: str | None
    cancelled_at: datetime | None
    created_at: datetime


class EventCard(ORMModel):
    """Compact shape used by list and carousel endpoints."""

    id: int
    event_name: str
    category: str
    start_date: datetime
    city: str
    banner: str
    price: float
    tickets_required: bool
    current_attendees: int
    max_attendees: int


class EventDetailOut(EventOut):
    """Public detail view, with registration state for the current attendee."""

    is_registered: bool = False
    organizer_username: str | None = None


class EventStatusFilter(APIModel):
    status: EventStatus | None = None
    search: str | None = Field(default=None, max_length=120)
    category: str | None = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


# --------------------------------------------------------------------------- #
# Registration / ticket
# --------------------------------------------------------------------------- #


class RegistrationOut(APIModel):
    id: int
    event_id: int
    attendee_id: int
    created_at: datetime


class RegistrationWithEvent(ORMModel):
    """A registration plus the event it refers to.

    Carries registration_id because withdrawing is keyed on the registration,
    not the event -- an attendee may re-register for the same event later.
    """

    registration_id: int
    registered_at: datetime
    event: EventOut


class RegistrationCreated(APIModel):
    registration: RegistrationOut
    event: EventOut


class TicketRequest(APIModel):
    """Request a ticket for one of your registrations.

    Deliberately carries only `event_id`. The frontend used to mint both the
    booking id and the secret code in the browser and POST them, so any client
    could claim an arbitrary booking id.
    """

    event_id: int


class TicketOut(ORMModel):
    id: int
    event_id: int
    attendee_id: int
    booking_id: str
    secret_code: str
    qr_code_value: str
    created_at: datetime


# --------------------------------------------------------------------------- #
# Notifications
# --------------------------------------------------------------------------- #


class NotificationOut(ORMModel):
    id: int
    subject: str
    message: str
    sender_kind: NotificationSender
    sender_name: str
    read_at: datetime | None
    created_at: datetime

    @computed_field  # type: ignore[prop-decorator]
    @property
    def read(self) -> bool:
        """Convenience flag for the UI, derived from read_at."""
        return self.read_at is not None


class NotificationPage(Page[NotificationOut]):
    pass


class MessageSend(APIModel):
    """Send a message to another role's inbox."""

    recipient_id: int | None = Field(
        default=None,
        description="Required when sending to a single recipient; omit for broadcast",
    )
    subject: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1, max_length=5000)
    recipient_kind: RecipientKind | None = None


class BroadcastOut(APIModel):
    recipients: int


class CancellationRequest(APIModel):
    reason: str = Field(min_length=1, max_length=500)


class ApprovalOut(APIModel):
    event: EventOut


EventSort = Literal["start_date", "-start_date", "created_at", "-created_at"]
"""Query values, not field names -- these stay snake_case on the wire."""