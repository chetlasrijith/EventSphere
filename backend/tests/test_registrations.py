"""Registration, capacity and search tests.

The original registration path compared `currentAttendees == maxAttendees`,
inserted, then incremented -- three round trips with no lock, so two concurrent
requests could both pass the capacity check. These tests pin the fixed
behaviour, including under real concurrency.
"""

from __future__ import annotations

import asyncio

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.errors import APIError
from app.db.session import SessionLocal
from app.main import create_app
from app.models.event import Event
from app.services import registrations as registration_service
from tests.helpers import create_event, register_attendee, register_organizer

EVENT_PAYLOAD = {
    "event_name": "Test Event",
    "category": "Tech",
    "start_date": "2030-01-01T10:00:00Z",
    "end_date": "2030-01-01T14:00:00Z",
    "venue": "Hall",
    "address": {
        "street": "1 St",
        "city": "Hyderabad",
        "state": "Telangana",
        "postal_code": "500001",
        "country": "India",
    },
    "max_attendees": 10,
}


@pytest.fixture
async def make_client():
    app = create_app()
    created: list[AsyncClient] = []

    def _new() -> AsyncClient:
        client = AsyncClient(
            transport=ASGITransport(app=app, raise_app_exceptions=True),
            base_url="http://testserver",
        )
        created.append(client)
        return client

    yield _new
    for client in created:
        await client.aclose()


@pytest.fixture
async def organizer_id(make_client):
    client = make_client()
    await register_organizer(client, "org")
    return (await client.get("/api/organizers/me")).json()["id"]


class TestRegistration:
    async def test_attendee_can_register_for_an_approved_event(self, make_client, organizer_id):
        event = await create_event(organizer_id, approved=True)
        attendee = make_client()
        await register_attendee(attendee, "alice")

        response = await attendee.post(f"/api/attendees/me/registrations/{event.id}")
        assert response.status_code == 201
        body = response.json()
        assert body["event"]["currentAttendees"] == 1

    async def test_cannot_register_for_a_pending_event(self, make_client, organizer_id):
        event = await create_event(organizer_id, approved=False)
        attendee = make_client()
        await register_attendee(attendee, "alice")

        response = await attendee.post(f"/api/attendees/me/registrations/{event.id}")
        assert response.status_code == 409
        assert response.json()["code"] == "event_not_open"

    async def test_cannot_register_twice_for_the_same_event(self, make_client, organizer_id):
        event = await create_event(organizer_id, approved=True)
        attendee = make_client()
        await register_attendee(attendee, "alice")

        first = await attendee.post(f"/api/attendees/me/registrations/{event.id}")
        assert first.status_code == 201

        second = await attendee.post(f"/api/attendees/me/registrations/{event.id}")
        assert second.status_code == 409
        assert second.json()["code"] == "already_registered"

    async def test_registration_for_missing_event_is_404(self, make_client):
        attendee = make_client()
        await register_attendee(attendee, "alice")
        response = await attendee.post("/api/attendees/me/registrations/99999")
        assert response.status_code == 404

    async def test_concurrent_registrations_cannot_oversell_an_event(self, organizer_id):
        """The core race the row lock exists to prevent.

        Five attendees register simultaneously for an event with capacity 2.
        Exactly two must succeed; the rest must be rejected. The old
        read-then-write logic let all five through.
        """
        from app.models.user import Attendee

        event = await create_event(organizer_id, max_attendees=2, approved=True)

        async with SessionLocal() as session:
            attendees = [
                Attendee(
                    username=f"racer{i}",
                    email=f"racer{i}@example.com",
                    password_hash="x",
                )
                for i in range(5)
            ]
            session.add_all(attendees)
            await session.commit()
            attendee_ids = [a.id for a in attendees]

        async def attempt(attendee_id: int) -> bool:
            async with SessionLocal() as session:
                from app.models.user import Attendee as A

                user = await session.get(A, attendee_id)
                try:
                    await registration_service.register_for_event(
                        session, event_id=event.id, attendee=user
                    )
                    return True
                except APIError:
                    return False

        results = await asyncio.gather(*(attempt(i) for i in attendee_ids))
        successes = sum(results)
        assert successes == 2, f"expected exactly 2 registrations, got {successes}"

        async with SessionLocal() as session:
            from sqlalchemy import func, select

            from app.models.event import EventRegistration

            count = await session.scalar(
                select(func.count(EventRegistration.id)).where(
                    EventRegistration.event_id == event.id
                )
            )
            stored = await session.get(Event, event.id)
            assert count == 2
            assert stored.current_attendees == 2


class TestCapacity:
    async def test_event_at_capacity_rejects_registration(self, make_client, organizer_id):
        event = await create_event(organizer_id, max_attendees=1, approved=True)

        first = make_client()
        await register_attendee(first, "alice")
        assert (await first.post(f"/api/attendees/me/registrations/{event.id}")).status_code == 201

        second = make_client()
        await register_attendee(second, "bob")
        response = await second.post(f"/api/attendees/me/registrations/{event.id}")
        assert response.status_code == 409
        assert response.json()["code"] == "event_full"

    async def test_withdrawing_frees_a_place(self, make_client, organizer_id):
        event = await create_event(organizer_id, max_attendees=1, approved=True)

        first = make_client()
        await register_attendee(first, "alice")
        registration = await first.post(f"/api/attendees/me/registrations/{event.id}")
        registration_id = registration.json()["registration"]["id"]
        await first.delete(f"/api/attendees/me/registrations/{registration_id}")

        second = make_client()
        await register_attendee(second, "bob")
        response = await second.post(f"/api/attendees/me/registrations/{event.id}")
        assert response.status_code == 201

    async def test_cannot_lower_capacity_below_registered_count(self, make_client):
        organizer = make_client()
        await register_organizer(organizer, "capowner")
        created = await organizer.post("/api/events", json=EVENT_PAYLOAD)
        event_id = created.json()["id"]
        # Registration requires an approved event.
        await _approve_all()

        first = make_client()
        await register_attendee(first, "alice")
        assert (
            await first.post(f"/api/attendees/me/registrations/{event_id}")
        ).status_code == 201
        second = make_client()
        await register_attendee(second, "bob")
        assert (
            await second.post(f"/api/attendees/me/registrations/{event_id}")
        ).status_code == 201

        # Cap is 10 with 2 registered, so dropping to 5 is legal.
        assert (
            await organizer.patch(f"/api/events/{event_id}", json={"max_attendees": 5})
        ).status_code == 200

        # Dropping below the 2 already registered would strand attendees.
        response = await organizer.patch(
            f"/api/events/{event_id}", json={"max_attendees": 1}
        )
        assert response.status_code == 409
        assert response.json()["code"] == "capacity_below_registered"

        # Zero is rejected by the schema regardless.
        invalid = await organizer.patch(f"/api/events/{event_id}", json={"max_attendees": 0})
        assert invalid.status_code == 422


class TestTickets:
    async def test_ticket_is_issued_for_a_registration(self, make_client, organizer_id):
        event = await create_event(organizer_id, approved=True)
        attendee = make_client()
        await register_attendee(attendee, "alice")
        await attendee.post(f"/api/attendees/me/registrations/{event.id}")

        response = await attendee.post("/api/attendees/me/tickets", json={"event_id": event.id})
        assert response.status_code == 201
        body = response.json()
        assert body["bookingId"]
        assert body["secretCode"]
        assert body["qrCodeValue"] == f"{event.id}_{body['secretCode']}"

    async def test_ticket_requires_a_registration(self, make_client, organizer_id):
        event = await create_event(organizer_id, approved=True)
        attendee = make_client()
        await register_attendee(attendee, "alice")

        response = await attendee.post("/api/attendees/me/tickets", json={"event_id": event.id})
        assert response.status_code == 400
        assert response.json()["code"] == "registration_required"

    async def test_client_cannot_choose_its_own_booking_id(self, make_client, organizer_id):
        """The frontend used to mint booking_id and secret_code in the browser.

        Any extra keys are now ignored, and the server values win.
        """
        event = await create_event(organizer_id, approved=True)
        attendee = make_client()
        await register_attendee(attendee, "alice")
        await attendee.post(f"/api/attendees/me/registrations/{event.id}")

        response = await attendee.post(
            "/api/attendees/me/tickets",
            json={
                "event_id": event.id,
                "booking_id": "ATTACKER_CHOSEN",
                "secret_code": "ATTACKER_SECRET",
            },
        )
        assert response.status_code == 201
        assert response.json()["bookingId"] != "ATTACKER_CHOSEN"
        assert response.json()["secretCode"] != "ATTACKER_SECRET"

    async def test_ticket_request_is_idempotent(self, make_client, organizer_id):
        event = await create_event(organizer_id, approved=True)
        attendee = make_client()
        await register_attendee(attendee, "alice")
        await attendee.post(f"/api/attendees/me/registrations/{event.id}")

        first = await attendee.post("/api/attendees/me/tickets", json={"event_id": event.id})
        second = await attendee.post("/api/attendees/me/tickets", json={"event_id": event.id})
        assert first.json()["id"] == second.json()["id"]

    async def test_withdrawing_a_registration_voids_the_ticket(self, make_client, organizer_id):
        event = await create_event(organizer_id, approved=True)
        attendee = make_client()
        await register_attendee(attendee, "alice")
        registration = await attendee.post(f"/api/attendees/me/registrations/{event.id}")
        await attendee.post("/api/attendees/me/tickets", json={"event_id": event.id})

        registration_id = registration.json()["registration"]["id"]
        await attendee.delete(f"/api/attendees/me/registrations/{registration_id}")

        tickets = (await attendee.get("/api/attendees/me/tickets")).json()
        assert tickets == []


async def _approve_all() -> None:
    """Mark every event approved, as an admin would."""
    from sqlalchemy import update

    from app.db.session import SessionLocal
    from app.models.enums import EventStatus

    async with SessionLocal() as session:
        await session.execute(update(Event).values(status=EventStatus.APPROVED))
        await session.commit()


class TestSearch:
    async def test_search_by_event_name(self, make_client):
        """Fixed: the original queried `eventName`, but the field was
        `eventname`, so search always returned an empty list."""
        organizer = make_client()
        await register_organizer(organizer, "searchowner")
        await organizer.post("/api/events", json={**EVENT_PAYLOAD, "event_name": "Python Conference"})
        await organizer.post("/api/events", json={**EVENT_PAYLOAD, "event_name": "Guitar Workshop"})
        await _approve_all()

        response = await make_client().get("/api/events", params={"search": "python"})
        assert response.status_code == 200
        body = response.json()
        assert body["total"] == 1
        assert body["items"][0]["eventName"] == "Python Conference"

    async def test_search_by_category(self, make_client):
        organizer = make_client()
        await register_organizer(organizer, "catsearcher")
        await organizer.post("/api/events", json={**EVENT_PAYLOAD, "category": "Design"})
        await _approve_all()

        response = await make_client().get("/api/events", params={"search": "design"})
        assert response.json()["total"] == 1

    async def test_search_by_speaker(self, make_client):
        organizer = make_client()
        await register_organizer(organizer, "speakerfinder")
        await organizer.post(
            "/api/events", json={**EVENT_PAYLOAD, "speakers": ["Margaret Hamilton"]}
        )
        await _approve_all()

        response = await make_client().get("/api/events", params={"search": "margaret"})
        assert response.json()["total"] == 1

    async def test_search_with_no_match_is_empty_not_an_error(self, make_client):
        response = await make_client().get("/api/events", params={"search": "zzzznotfound"})
        assert response.status_code == 200
        assert response.json()["total"] == 0


class TestEventLifecycle:
    async def test_new_events_start_pending(self, make_client):
        organizer = make_client()
        await register_organizer(organizer, "org")
        response = await organizer.post("/api/events", json=EVENT_PAYLOAD)
        assert response.status_code == 201
        assert response.json()["status"] == "pending"

    async def test_end_date_before_start_date_is_rejected(self, make_client):
        organizer = make_client()
        await register_organizer(organizer, "org")
        response = await organizer.post(
            "/api/events",
            json={**EVENT_PAYLOAD, "start_date": "2030-01-02T10:00:00Z", "end_date": "2030-01-01T10:00:00Z"},
        )
        assert response.status_code == 422

    async def test_past_approved_events_are_marked_completed(self, make_client, organizer_id):
        """The original only ran this sweep inside one admin listing route."""
        from datetime import datetime, timedelta, timezone

        from sqlalchemy import select

        start = datetime.now(timezone.utc) - timedelta(days=10)
        event = await create_event(organizer_id, approved=True)
        async with SessionLocal() as session:
            await session.execute(
                Event.__table__.update()
                .where(Event.id == event.id)
                .values(start_date=start, end_date=start + timedelta(hours=2))
            )
            await session.commit()

        await make_client().get("/api/events")

        async with SessionLocal() as session:
            stored = await session.scalar(select(Event).where(Event.id == event.id))
            assert stored.status == "completed"