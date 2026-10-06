"""Seed the database with a usable set of development accounts and events.

Run with:  python -m app.db.seed
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.enums import AdminStatus, EventStatus, EventType, NotificationSender
from app.models.event import Event
from app.models.notification import RecipientKind
from app.models.user import Admin, Attendee, Organizer, SuperAdminWhitelist
from app.services import notifications as notification_service

SUPERADMIN_EMAIL = "superadmin@example.com"
ADMIN_EMAIL = "admin@example.com"


def _future(days: int) -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=days)


async def seed() -> None:
    async with SessionLocal() as session:
        existing = await session.scalar(select(Attendee).limit(1))
        if existing is not None:
            print("Database already seeded; nothing to do.")
            return

        # --- SuperAdmin -------------------------------------------------- #
        session.add(SuperAdminWhitelist(email=SUPERADMIN_EMAIL))
        superadmin = Admin(
            username="superadmin",
            email=SUPERADMIN_EMAIL,
            password_hash=hash_password("superadmin123"),
            status=AdminStatus.APPROVED,
        )
        session.add(superadmin)

        # --- Admin ------------------------------------------------------- #
        session.add(
            Admin(
                username="admin",
                email=ADMIN_EMAIL,
                password_hash=hash_password("admin123"),
                status=AdminStatus.APPROVED,
            )
        )

        # --- Organizers -------------------------------------------------- #
        organizer = Organizer(
            username="techfest_org",
            email="organizer@example.com",
            password_hash=hash_password("organizer123"),
            mobile_number="9876543210",
            street="12 MG Road",
            city="Hyderabad",
            state="Telangana",
            postal_code="500001",
            country="India",
            about="We run technology conferences across India.",
            rating=4.5,
        )
        session.add(organizer)

        # --- Attendees --------------------------------------------------- #
        for index in range(1, 4):
            session.add(
                Attendee(
                    username=f"attendee{index}",
                    email=f"attendee{index}@example.com",
                    password_hash=hash_password("attendee123"),
                    mobile_number=f"900000000{index}",
                )
            )

        await session.flush()

        # --- Events ------------------------------------------------------ #
        events = [
            Event(
                event_name="TechFest 2026",
                category="Technology",
                description="A day of talks and workshops on modern web engineering.",
                start_date=_future(30),
                end_date=_future(30) + timedelta(hours=8),
                venue="HITEX Exhibition Centre",
                street="Madhapur",
                city="Hyderabad",
                state="Telangana",
                postal_code="500081",
                country="India",
                event_type=EventType.PUBLIC,
                tickets_required=True,
                price=499.0,
                max_attendees=200,
                speakers=["Ada Lovelace", "Grace Hopper"],
                services=["Keynote talks", "Workshops", "Networking"],
                sponsors=["Acme Corp"],
                status=EventStatus.APPROVED,
                approved_by_id=superadmin.id,
                banner="",
                organizer_id=organizer.id,
            ),
            Event(
                event_name="Startup Meetup",
                category="Business",
                description="Founders and investors meetup.",
                start_date=_future(14),
                end_date=_future(14) + timedelta(hours=3),
                venue="WeWork Banjara Hills",
                street="Road No 12",
                city="Hyderabad",
                state="Telangana",
                postal_code="500034",
                country="India",
                event_type=EventType.PUBLIC,
                tickets_required=False,
                price=0,
                max_attendees=80,
                speakers=["Ravi Kumar"],
                services=["Pitch session", "Panels"],
                sponsors=[],
                status=EventStatus.APPROVED,
                approved_by_id=superadmin.id,
                banner="",
                organizer_id=organizer.id,
            ),
            Event(
                event_name="Design Workshop (pending review)",
                category="Design",
                description="Hands-on workshop on design systems.",
                start_date=_future(45),
                end_date=_future(45) + timedelta(hours=6),
                venue="Community Hall",
                street="Banjara Hills",
                city="Hyderabad",
                state="Telangana",
                postal_code="500034",
                country="India",
                event_type=EventType.PUBLIC,
                tickets_required=True,
                price=250.0,
                max_attendees=40,
                speakers=["Jane Doe"],
                services=["Hands-on exercises"],
                sponsors=[],
                status=EventStatus.PENDING,
                banner="",
                organizer_id=organizer.id,
            ),
        ]
        session.add_all(events)
        organizer.event_count = len(events)

        await notification_service.notify(
            session,
            recipient_kind=RecipientKind.ORGANIZER,
            recipient_id=organizer.id,
            sender_kind=NotificationSender.SYSTEM,
            sender_id=None,
            sender_name="EventSphere",
            subject="Welcome to EventSphere",
            message="Your organizer account is ready. Create your first event to get started.",
        )
        await session.commit()

        print("Seeded:")
        print(f"  SuperAdmin  {SUPERADMIN_EMAIL} / superadmin123")
        print(f"  Admin       {ADMIN_EMAIL} / admin123")
        print("  Organizer   organizer@example.com / organizer123  (username: techfest_org)")
        print("  Attendees   attendee1..3@example.com / attendee123")


if __name__ == "__main__":
    asyncio.run(seed())