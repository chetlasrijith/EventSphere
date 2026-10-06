"""Shared helpers for building accounts and signing in during tests."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from httpx import AsyncClient

from app.models.enums import AdminStatus
from app.models.event import Event
from app.models.user import Admin, SuperAdminWhitelist


def future(days: int) -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=days)


async def register_attendee(
    client: AsyncClient, username: str = "attendee", password: str = "password123"
) -> dict:
    response = await client.post(
        "/api/auth/attendee/signup",
        json={
            "username": username,
            "email": f"{username}@example.com",
            "password": password,
            "mobile_number": "9876543210",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


async def register_organizer(
    client: AsyncClient, username: str = "organizer", password: str = "password123"
) -> dict:
    response = await client.post(
        "/api/auth/organizer/signup",
        json={
            "username": username,
            "email": f"{username}@example.com",
            "password": password,
            "mobile_number": "9876543210",
            "address": {
                "street": "1 Main St",
                "city": "Hyderabad",
                "state": "Telangana",
                "postal_code": "500001",
                "country": "India",
            },
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


async def register_admin(
    client: AsyncClient, username: str = "admin", password: str = "password123"
) -> dict:
    response = await client.post(
        "/api/auth/admin/signup",
        json={
            "username": username,
            "email": f"{username}@example.com",
            "password": password,
            "mobile_number": "9876543210",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


async def approve_admin(db_session, username: str = "admin") -> Admin:
    """Approve an admin directly, bypassing the SuperAdmin approval flow."""
    from sqlalchemy import select

    admin = await db_session.scalar(select(Admin).where(Admin.username == username))
    assert admin is not None, f"no admin named {username}"
    admin.status = AdminStatus.APPROVED
    await db_session.commit()
    return admin


async def make_superadmin(db_session, email: str) -> None:
    db_session.add(SuperAdminWhitelist(email=email))
    await db_session.commit()


async def create_event(
    organizer_id: int,
    *,
    name: str = "Test Event",
    max_attendees: int = 10,
    approved: bool = False,
) -> Event:
    from app.db.session import SessionLocal

    start = future(30)
    event = Event(
        event_name=name,
        category="Technology",
        description="A test event",
        start_date=start,
        end_date=start + timedelta(hours=4),
        venue="Test Hall",
        street="1 Main St",
        city="Hyderabad",
        state="Telangana",
        postal_code="500001",
        country="India",
        max_attendees=max_attendees,
        status="approved" if approved else "pending",
        organizer_id=organizer_id,
    )
    # Attach to a live session so the object is usable by the caller.
    async with SessionLocal() as session:
        session.add(event)
        await session.commit()
        await session.refresh(event)
        return event


async def login(client: AsyncClient, role: str, identifier: str, password: str = "password123"):
    response = await client.post(
        f"/api/auth/{role}/login",
        json={"identifier": identifier, "password": password},
    )
    assert response.status_code == 200, response.text
    return response.json()