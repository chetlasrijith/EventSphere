"""Enums shared across models and schemas."""

from __future__ import annotations

import enum


class UserRole(str, enum.Enum):
    ATTENDEE = "Attendee"
    ORGANIZER = "Organizer"
    ADMIN = "Admin"
    SUPERADMIN = "SuperAdmin"


def enum_values(enum_cls: type[enum.Enum]) -> list[str]:
    """Return member *values* for use as a SQLAlchemy ``values_callable``.

    Without this, SQLAlchemy persists the member name (``PENDING``) while
    ``server_default`` emits the value (``pending``), and Postgres rejects the
    default on insert. Forcing values everywhere keeps the stored text equal to
    the value -- which also means the database text matches the JWT role claim.
    """
    return [member.value for member in enum_cls]


class EventStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class EventType(str, enum.Enum):
    PUBLIC = "public"
    PRIVATE = "private"


class AdminStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class NotificationSender(str, enum.Enum):
    """Who a notification claims to come from.

    Stored as a native enum column. The original schema used a polymorphic
    'from' column with mixed string/ObjectId values, which made it impossible to
    join against the sender reliably.
    """

    SYSTEM = "EventSphere"
    ORGANIZER = "Organizer"
    ATTENDEE = "Attendee"
    ADMIN = "Admin"