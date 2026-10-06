"""Model package. Importing this module registers every table on Base.metadata."""

from app.db.base import Base
from app.models.enums import (
    AdminStatus,
    EventStatus,
    EventType,
    NotificationSender,
    UserRole,
)
from app.models.event import Event, EventRegistration, Ticket
from app.models.notification import Notification, RecipientKind
from app.models.user import (
    Achievement,
    Admin,
    Artist,
    Attendee,
    Experience,
    Organizer,
    SuperAdminWhitelist,
)

__all__ = [
    "Base",
    "Achievement",
    "Admin",
    "AdminStatus",
    "Artist",
    "Attendee",
    "Event",
    "EventRegistration",
    "EventStatus",
    "EventType",
    "Experience",
    "Notification",
    "NotificationSender",
    "Organizer",
    "RecipientKind",
    "SuperAdminWhitelist",
    "Ticket",
    "UserRole",
]