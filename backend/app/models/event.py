"""Event, registration, and ticket tables."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.enums import EventStatus, EventType, enum_values
from app.models.user import Attendee, Organizer


class Event(Base, TimestampMixin):
    __tablename__ = "events"
    __table_args__ = (
        UniqueConstraint("event_name", name="uq_events_event_name"),
        CheckConstraint("end_date > start_date", name="end_after_start"),
        CheckConstraint("max_attendees > 0", name="max_attendees_positive"),
        CheckConstraint("current_attendees >= 0", name="current_attendees_non_negative"),
        CheckConstraint("current_attendees <= max_attendees", name="within_capacity"),
        CheckConstraint("price >= 0", name="price_non_negative"),
        Index("ix_events_status_start_date", "status", "start_date"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    event_name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)

    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    venue: Mapped[str] = mapped_column(String(255), nullable=False)
    street: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(120), nullable=False)
    state: Mapped[str] = mapped_column(String(120), nullable=False)
    postal_code: Mapped[str] = mapped_column(String(20), nullable=False)
    country: Mapped[str] = mapped_column(String(120), nullable=False)

    event_type: Mapped[EventType] = mapped_column(
        Enum(EventType, name="event_type", values_callable=enum_values),
        default=EventType.PUBLIC,
        server_default=EventType.PUBLIC.value,
        nullable=False,
    )
    tickets_required: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false", nullable=False
    )
    price: Mapped[float] = mapped_column(
        Numeric(10, 2), default=0, server_default="0", nullable=False
    )
    max_attendees: Mapped[int] = mapped_column(Integer, nullable=False)
    # Denormalised count kept in step with event_registrations by the
    # registration service inside a single transaction. The DB constraint above
    # is what actually prevents overselling.
    current_attendees: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0", nullable=False
    )

    banner: Mapped[str] = mapped_column(String(500), default="", server_default="")

    # Real arrays. The original stored these as comma-joined strings while the
    # update controller spread them as arrays, which raised a TypeError.
    speakers: Mapped[list[str]] = mapped_column(
        ARRAY(String(150)), default=list, server_default="{}", nullable=False
    )
    services: Mapped[list[str]] = mapped_column(
        ARRAY(Text), default=list, server_default="{}", nullable=False
    )
    sponsors: Mapped[list[str]] = mapped_column(
        ARRAY(String(200)), default=list, server_default="{}", nullable=False
    )

    status: Mapped[EventStatus] = mapped_column(
        Enum(EventStatus, name="event_status", values_callable=enum_values),
        default=EventStatus.PENDING,
        server_default=EventStatus.PENDING.value,
        nullable=False,
    )
    approved_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("admins.id", ondelete="SET NULL")
    )
    cancelled_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("admins.id", ondelete="SET NULL")
    )
    cancellation_reason: Mapped[str | None] = mapped_column(Text)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    roar: Mapped[str] = mapped_column(
        String(500), default="Event not started yet", server_default="Event not started yet"
    )

    organizer_id: Mapped[int] = mapped_column(
        ForeignKey("organizers.id", ondelete="CASCADE"), nullable=False, index=True
    )

    organizer: Mapped[Organizer] = relationship(back_populates="events", lazy="joined")
    registrations: Mapped[list["EventRegistration"]] = relationship(
        back_populates="event", cascade="all, delete-orphan", lazy="noload"
    )


class EventRegistration(Base, TimestampMixin):
    __tablename__ = "event_registrations"
    __table_args__ = (
        # The real fix for duplicate registrations: the old code checked
        # registeredEvents then inserted, which races under concurrent requests.
        UniqueConstraint("event_id", "attendee_id", name="uq_registrations_event_attendee"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(
        ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True
    )
    attendee_id: Mapped[int] = mapped_column(
        ForeignKey("attendees.id", ondelete="CASCADE"), nullable=False, index=True
    )

    event: Mapped[Event] = relationship(back_populates="registrations", lazy="joined")
    attendee: Mapped[Attendee] = relationship(back_populates="registrations", lazy="noload")


class Ticket(Base):
    __tablename__ = "tickets"
    __table_args__ = (
        UniqueConstraint("booking_id", name="uq_tickets_booking_id"),
        UniqueConstraint("event_id", "attendee_id", name="uq_tickets_event_attendee"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(
        ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True
    )
    attendee_id: Mapped[int] = mapped_column(
        ForeignKey("attendees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    booking_id: Mapped[str] = mapped_column(String(32), nullable=False)
    secret_code: Mapped[str] = mapped_column(String(32), nullable=False)
    qr_code_value: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    event: Mapped[Event] = relationship(lazy="joined")
    attendee: Mapped[Attendee] = relationship(back_populates="tickets", lazy="noload")