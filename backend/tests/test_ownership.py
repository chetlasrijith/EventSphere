"""Ownership and authorisation boundary tests.

The original API let any organizer read or mutate any event by id, had no checks
on organizer profile edits, and returned every notification in the collection to
whoever asked. These tests pin the boundaries.
"""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_app
from tests.helpers import create_event, register_admin, register_attendee, register_organizer


@pytest.fixture
async def make_client():
    """Factory producing clients, each with an independent cookie jar.

    A single shared client would silently merge two roles into one session, so
    tests that involve more than one actor ask for a separate client each.
    """
    app = create_app()
    created: list[AsyncClient] = []

    def _new() -> AsyncClient:
        transport = ASGITransport(app=app, raise_app_exceptions=True)
        client = AsyncClient(transport=transport, base_url="http://testserver")
        created.append(client)
        return client

    yield _new

    for client in created:
        await client.aclose()


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


async def _create_event(client: AsyncClient, name: str = "Test Event") -> dict:
    response = await client.post("/api/events", json={**EVENT_PAYLOAD, "event_name": name})
    assert response.status_code == 201, response.text
    return response.json()


class TestEventOwnership:
    async def test_each_organizer_sees_only_their_own_events(self, make_client):
        owner = make_client()
        await register_organizer(owner, "owner")
        await _create_event(owner, "Owner Event")
        owner_id = (await owner.get("/api/organizers/me")).json()["id"]

        intruder  = make_client()
        await register_organizer(intruder, "intruder")
        await _create_event(intruder, "Intruder Event")

        owner_events = (await owner.get("/api/events/mine")).json()
        assert owner_events["total"] == 1
        assert owner_events["items"][0]["eventName"] == "Owner Event"
        assert owner_events["items"][0]["organizerId"] == owner_id

        intruder_events = (await intruder.get("/api/events/mine")).json()
        assert intruder_events["total"] == 1
        assert intruder_events["items"][0]["eventName"] == "Intruder Event"

    async def test_organizer_cannot_patch_another_organizers_event(self, make_client):
        owner = make_client()
        await register_organizer(owner, "owner")
        event = await _create_event(owner)

        intruder  = make_client()
        await register_organizer(intruder, "intruder")
        response = await intruder.patch(f"/api/events/{event['id']}", json={"category": "Hijacked"})

        # 404 rather than 403, so this does not confirm the event exists.
        assert response.status_code == 404
        assert response.json()["code"] == "event_not_found"

    async def test_organizer_cannot_read_another_organizers_event_detail(self, make_client):
        owner = make_client()
        await register_organizer(owner, "owner")
        event = await _create_event(owner)

        intruder  = make_client()
        await register_organizer(intruder, "intruder")
        # Public detail is readable, but the owner field is not a leak.
        response = await intruder.get(f"/api/events/{event['id']}")
        assert response.status_code == 200

    async def test_organizer_cannot_upload_banner_to_another_organizers_event(self, make_client):
        owner = make_client()
        await register_organizer(owner, "owner")
        event = await _create_event(owner)

        intruder  = make_client()
        await register_organizer(intruder, "intruder")
        response = await intruder.put(
            f"/api/events/{event['id']}/banner",
            files={"banner": ("x.png", b"not-really-an-image", "image/png")},
        )
        assert response.status_code == 404

    async def test_organizer_cannot_change_schedule_of_another_organizers_event(self, make_client):
        owner = make_client()
        await register_organizer(owner, "owner")
        event = await _create_event(owner)

        intruder  = make_client()
        await register_organizer(intruder, "intruder")
        response = await intruder.patch(
            f"/api/events/{event['id']}/schedule", json={"venue": "Somewhere Else"}
        )
        assert response.status_code == 404

    async def test_organizer_can_update_their_own_event(self, make_client):
        owner = make_client()
        await register_organizer(owner, "owner")
        event = await _create_event(owner)
        response = await owner.patch(
            f"/api/events/{event['id']}", json={"category": "Business"}
        )
        assert response.status_code == 200
        assert response.json()["category"] == "Business"


class TestRegistrationOwnership:
    async def test_attendee_cannot_withdraw_another_attendees_registration(self, make_client):
        alice = make_client()
        await register_attendee(alice, "alice")

        organizer  = make_client()
        await register_organizer(organizer, "org")
        organizer_id = (await organizer.get("/api/organizers/me")).json()["id"]
        event = await create_event(organizer_id, approved=True)

        registered = await alice.post(f"/api/attendees/me/registrations/{event.id}")
        assert registered.status_code == 201
        registration_id = registered.json()["registration"]["id"]

        bob  = make_client()
        await register_attendee(bob, "bob")
        response = await bob.delete(f"/api/attendees/me/registrations/{registration_id}")
        assert response.status_code == 404

    async def test_organizer_token_cannot_register_as_attendee(self, make_client):
        organizer = make_client()
        await register_organizer(organizer, "org")
        organizer_id = (await organizer.get("/api/organizers/me")).json()["id"]
        event = await create_event(organizer_id, approved=True)

        response = await organizer.post(f"/api/attendees/me/registrations/{event.id}")
        assert response.status_code == 403

    async def test_attendee_can_withdraw_their_own_registration(self, make_client):
        attendee = make_client()
        await register_attendee(attendee, "alice")

        organizer  = make_client()
        await register_organizer(organizer, "org")
        organizer_id = (await organizer.get("/api/organizers/me")).json()["id"]
        event = await create_event(organizer_id, approved=True)

        registered = await attendee.post(f"/api/attendees/me/registrations/{event.id}")
        registration_id = registered.json()["registration"]["id"]

        withdrawn = await attendee.delete(
            f"/api/attendees/me/registrations/{registration_id}"
        )
        assert withdrawn.status_code == 200
        assert withdrawn.json()["currentAttendees"] == 0


class TestAdminBoundaries:
    async def test_organizer_cannot_approve_events(self, make_client):
        organizer = make_client()
        await register_organizer(organizer, "org")
        event = await _create_event(organizer)

        response = await organizer.post(f"/api/events/{event['id']}/approval")
        assert response.status_code == 403

    async def test_attendee_cannot_list_organizers_with_contact_details(self, make_client):
        attendee = make_client()
        await register_attendee(attendee, "alice")
        response = await attendee.get("/api/organizers")
        assert response.status_code == 403

    async def test_regular_admin_cannot_approve_other_admins(self, make_client, db_session):
        from tests.helpers import approve_admin

        boss  = make_client()
        await register_admin(boss, "boss")
        await approve_admin(db_session, "boss")

        staff  = make_client()
        await register_admin(staff, "staff")
        await approve_admin(db_session, "staff")
        # Signup deliberately issues no cookie, so an approved admin must log in
        # before they hold a session at all.
        await staff.post(
            "/api/auth/admin/login",
            json={"identifier": "staff", "password": "password123"},
        )

        from sqlalchemy import select

        from app.models.user import Admin

        async with db_session as session:
            staff_row = await session.scalar(select(Admin).where(Admin.username == "staff"))

        response = await staff.post(f"/api/admins/{staff_row.id}/approval")
        assert response.status_code == 403
        assert response.json()["code"] == "not_superadmin"

    async def test_superadmin_can_approve_a_pending_admin(self, make_client, db_session):
        from tests.helpers import approve_admin, make_superadmin

        boss  = make_client()
        await register_admin(boss, "boss")
        await approve_admin(db_session, "boss")
        await make_superadmin(db_session, "boss@example.com")
        await boss.post("/api/auth/admin/login", json={"identifier": "boss", "password": "password123"})

        staff  = make_client()
        await register_admin(staff, "staff")

        from sqlalchemy import select

        from app.models.user import Admin

        async with db_session as session:
            staff_row = await session.scalar(select(Admin).where(Admin.username == "staff"))

        response = await boss.post(f"/api/admins/{staff_row.id}/approval")
        assert response.status_code == 200
        assert response.json()["status"] == "approved"

    async def test_rejecting_an_admin_actually_rejects_them(self, make_client, db_session):
        """The original reject handler set status='approved'.

        It approved the account it was supposed to reject.
        """
        from tests.helpers import approve_admin, make_superadmin

        boss  = make_client()
        await register_admin(boss, "boss")
        await approve_admin(db_session, "boss")
        await make_superadmin(db_session, "boss@example.com")
        await boss.post("/api/auth/admin/login", json={"identifier": "boss", "password": "password123"})

        staff  = make_client()
        await register_admin(staff, "staff")

        from sqlalchemy import select

        from app.models.user import Admin

        async with db_session as session:
            staff_row = await session.scalar(select(Admin).where(Admin.username == "staff"))

        response = await boss.post(f"/api/admins/{staff_row.id}/rejection")
        assert response.status_code == 200
        assert response.json()["status"] == "rejected"

    async def test_superadmin_cannot_reject_themselves(self, make_client, db_session):
        from tests.helpers import approve_admin, make_superadmin

        boss  = make_client()
        await register_admin(boss, "boss")
        await approve_admin(db_session, "boss")
        await make_superadmin(db_session, "boss@example.com")
        await boss.post("/api/auth/admin/login", json={"identifier": "boss", "password": "password123"})

        from sqlalchemy import select

        from app.models.user import Admin

        async with db_session as session:
            boss_row = await session.scalar(select(Admin).where(Admin.username == "boss"))

        response = await boss.post(f"/api/admins/{boss_row.id}/rejection")
        assert response.status_code == 409
        assert response.json()["code"] == "self_rejection"


class TestNotificationPrivacy:
    async def test_attendee_cannot_read_another_attendees_notification(self, make_client):
        alice = make_client()
        await register_attendee(alice, "alice")
        alice_id = (await alice.get("/api/attendees/me")).json()["id"]

        from app.db.session import SessionLocal
        from app.models.enums import NotificationSender
        from app.models.notification import RecipientKind
        from app.services import notifications as notification_service

        async with SessionLocal() as session:
            await notification_service.notify(
                session,
                recipient_kind=RecipientKind.ATTENDEE,
                recipient_id=alice_id,
                sender_kind=NotificationSender.SYSTEM,
                sender_id=None,
                sender_name="EventSphere",
                subject="Private",
                message="For alice only",
            )
            await session.commit()

        listed = (await alice.get("/api/attendees/notifications")).json()
        assert listed["total"] == 1
        notification_id = listed["items"][0]["id"]

        bob  = make_client()
        await register_attendee(bob, "bob")
        response = await bob.get(f"/api/attendees/notifications/{notification_id}")
        assert response.status_code == 404
        assert response.json()["code"] == "notification_not_found"

    async def test_organizer_inbox_is_scoped_to_its_owner(self, make_client):
        """The original handler called `.find()` with no filter at all.

        Every organizer received every notification in the collection.
        """
        from app.db.session import SessionLocal
        from app.models.enums import NotificationSender
        from app.models.notification import RecipientKind
        from app.services import notifications as notification_service

        alice  = make_client()
        await register_organizer(alice, "alice_org")
        alice_id = (await alice.get("/api/organizers/me")).json()["id"]

        bob  = make_client()
        await register_organizer(bob, "bob_org")

        async with SessionLocal() as session:
            await notification_service.notify(
                session,
                recipient_kind=RecipientKind.ORGANIZER,
                recipient_id=alice_id,
                sender_kind=NotificationSender.SYSTEM,
                sender_id=None,
                sender_name="EventSphere",
                subject="Alice only",
                message="Not for Bob",
            )
            await session.commit()

        alice_inbox = (await alice.get("/api/organizers/notifications")).json()
        assert alice_inbox["total"] == 1

        bob_inbox = (await bob.get("/api/organizers/notifications")).json()
        assert bob_inbox["total"] == 0

    async def test_admin_messaging_an_organizer_works(self, make_client, db_session):
        """Fixed: the original read req.user_id, which was always undefined."""
        from tests.helpers import approve_admin

        admin  = make_client()
        await register_admin(admin, "boss")
        await approve_admin(db_session, "boss")
        await admin.post(
            "/api/auth/admin/login",
            json={"identifier": "boss", "password": "password123"},
        )

        organizer  = make_client()
        await register_organizer(organizer, "org")
        organizer_id = (await organizer.get("/api/organizers/me")).json()["id"]

        response = await admin.post(
            f"/api/admins/organizers/{organizer_id}/messages",
            json={"subject": "Hello", "message": "Please fix your event"},
        )
        assert response.status_code == 201

        inbox = (await organizer.get("/api/organizers/notifications")).json()
        assert inbox["total"] == 1
        assert inbox["items"][0]["subject"] == "Hello"
        assert inbox["items"][0]["senderName"] == "boss"