"""Unified notification table.

Replaces three near-duplicate Mongo schemas (admin/attendee/organizer
notifications). The originals stored `from` as a Mixed field holding either a
bare string or an ObjectId, so `notification.from?.name` was always undefined
and every notification rendered as "Unknown".
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.enums import NotificationSender, enum_values


class RecipientKind(str, PyEnum):
    ORGANIZER = "Organizer"
    ATTENDEE = "Attendee"
    ADMIN = "Admin"


class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = (
        Index("ix_notifications_recipient_created", "recipient_kind", "created_at"),
        # Exactly one inbox column is populated, and it matches recipient_kind.
        CheckConstraint(
            "(recipient_kind = 'Organizer' AND organizer_recipient_id IS NOT NULL"
            " AND attendee_recipient_id IS NULL AND admin_recipient_id IS NULL)"
            " OR (recipient_kind = 'Attendee' AND attendee_recipient_id IS NOT NULL"
            " AND organizer_recipient_id IS NULL AND admin_recipient_id IS NULL)"
            " OR (recipient_kind = 'Admin' AND admin_recipient_id IS NOT NULL"
            " AND organizer_recipient_id IS NULL AND attendee_recipient_id IS NULL)",
            name="single_recipient_matches_kind",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    subject: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)

    recipient_kind: Mapped[RecipientKind] = mapped_column(
        Enum(
            RecipientKind,
            name="notification_recipient_kind",
            values_callable=enum_values,
        ),
        nullable=False,
    )
    # Separate nullable FKs instead of a polymorphic (kind, id) pair: keeps
    # referential integrity and ON DELETE CASCADE working, which a bare id
    # column cannot.
    organizer_recipient_id: Mapped[int | None] = mapped_column(
        ForeignKey("organizers.id", ondelete="CASCADE"), index=True
    )
    attendee_recipient_id: Mapped[int | None] = mapped_column(
        ForeignKey("attendees.id", ondelete="CASCADE"), index=True
    )
    admin_recipient_id: Mapped[int | None] = mapped_column(
        ForeignKey("admins.id", ondelete="CASCADE"), index=True
    )

    sender_kind: Mapped[NotificationSender] = mapped_column(
        Enum(
            NotificationSender,
            name="notification_sender",
            values_callable=enum_values,
        ),
        nullable=False,
    )
    # Deliberately *not* a foreign key. Senders span all three role tables, so a
    # single FK is impossible; a hard reference to organizers would raise a
    # foreign-key violation whenever an admin or attendee sent a message.
    # Integrity is maintained on the recipient side (three real nullable FKs)
    # and sender_name is snapshotted below.
    sender_id: Mapped[int | None] = mapped_column(Integer)
    # Display name snapshotted at send time, so an inbox still renders after the
    # sender's account is deleted.
    sender_name: Mapped[str] = mapped_column(String(120), nullable=False)

    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    @property
    def recipient_id(self) -> int:
        """The populated recipient FK, for use in queries and serialisation."""
        return (
            self.organizer_recipient_id
            or self.attendee_recipient_id
            or self.admin_recipient_id
        )