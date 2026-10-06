"""Wire-format contract tests.

The React frontend is written in camelCase, so the API serialises camelCase
field names while Python keeps snake_case. These tests pin that contract --
including the query-string cases that the Pydantic alias generator does not
cover -- so a refactor cannot silently break every component at once.
"""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_app
from tests.helpers import register_attendee, register_organizer

ADDRESS = {
    "street": "1 Main St",
    "city": "Hyderabad",
    "state": "Telangana",
    "postal_code": "500001",
    "country": "India",
}

EVENT = {
    "event_name": "Contract Event",
    "category": "Tech",
    "start_date": "2030-01-01T10:00:00Z",
    "end_date": "2030-01-01T14:00:00Z",
    "venue": "Hall",
    "address": ADDRESS,
    "max_attendees": 10,
}


@pytest.fixture
async def make_client():
    app = create_app()
    made = []

    def _new() -> AsyncClient:
        client = AsyncClient(
            transport=ASGITransport(app=app, raise_app_exceptions=True),
            base_url="http://testserver",
        )
        made.append(client)
        return client

    yield _new
    for client in made:
        await client.aclose()


async def _approve_all() -> None:
    from sqlalchemy import update

    from app.db.session import SessionLocal
    from app.models.enums import EventStatus
    from app.models.event import Event

    async with SessionLocal() as session:
        await session.execute(update(Event).values(status=EventStatus.APPROVED))
        await session.commit()


class TestCamelCaseResponses:
    async def test_event_fields_are_camel_case(self, make_client):
        organizer = make_client()
        await register_organizer(organizer, "contractorg")
        response = await organizer.post("/api/events", json=EVENT)
        assert response.status_code == 201
        body = response.json()

        assert "eventName" in body
        assert "event_name" not in body
        assert "startDate" in body
        assert "currentAttendees" in body
        assert "maxAttendees" in body
        assert "createdAt" in body
        # Flattened address fields.
        assert body["postalCode"] == "500001"
        assert "postal_code" not in body

    async def test_session_response_is_camel_case(self, make_client):
        client = make_client()
        await register_attendee(client, "alice")
        response = await client.post(
            "/api/auth/attendee/login",
            json={"identifier": "alice", "password": "password123"},
        )
        body = response.json()
        assert body["role"] == "Attendee"
        assert "userId" not in body  # id is a single word, unchanged

    async def test_page_envelope_is_camel_case(self, make_client):
        organizer = make_client()
        await register_organizer(organizer, "pagedorg")
        for index in range(3):
            await organizer.post("/api/events", json={**EVENT, "event_name": f"Envelope Event {index}"})
        await _approve_all()

        response = await make_client().get("/api/events")
        body = response.json()
        assert "totalPages" in body
        assert "pageSize" in body
        assert "total_pages" not in body
        assert "page_size" not in body


class TestQueryParameterSpellings:
    async def test_page_size_accepts_camel_and_snake(self, make_client):
        """FastAPI query params bypass the alias generator, so both are handled
        explicitly in `pagination_from_query`."""
        organizer = make_client()
        await register_organizer(organizer, "qorg")
        for index in range(3):
            r = await organizer.post("/api/events", json={**EVENT, "event_name": f"Query Event {index}"})
            assert r.status_code == 201, r.text
        await _approve_all()

        camel = await make_client().get("/api/events", params={"pageSize": 1})
        snake = await make_client().get("/api/events", params={"page_size": 1})

        assert camel.json()["pageSize"] == 1
        assert snake.json()["pageSize"] == 1
        assert len(camel.json()["items"]) == 1

    async def test_camel_case_request_body_is_accepted(self, make_client):
        """`populate_by_name` means a client may send either spelling."""
        organizer = make_client()
        await register_organizer(organizer, "bodyorg")

        response = await organizer.post(
            "/api/events",
            json={
                "eventName": "Camel Body",
                "category": "Tech",
                "startDate": "2030-01-01T10:00:00Z",
                "endDate": "2030-01-01T14:00:00Z",
                "venue": "Hall",
                "address": {
                    "street": "1 St",
                    "city": "Hyderabad",
                    "state": "Telangana",
                    "postalCode": "500001",
                    "country": "India",
                },
                "maxAttendees": 5,
            },
        )
        assert response.status_code == 201, response.text
        assert response.json()["eventName"] == "Camel Body"

    async def test_snake_case_request_body_still_accepted(self, make_client):
        organizer = make_client()
        await register_organizer(organizer, "snakeorg")
        response = await organizer.post("/api/events", json=EVENT)
        assert response.status_code == 201


class TestErrorEnvelope:
    async def test_not_found_shape(self, make_client):
        response = await make_client().get("/api/events/424242")
        assert response.status_code == 404
        body = response.json()
        assert set(body) == {"detail", "code"}
        assert body["code"] == "event_not_found"

    async def test_unauthenticated_shape(self, make_client):
        response = await make_client().get("/api/attendees/me")
        assert response.status_code == 401
        assert set(response.json()) == {"detail", "code"}

    async def test_validation_error_includes_fields(self, make_client):
        response = await make_client().post(
            "/api/auth/attendee/signup",
            json={"username": "a", "email": "not-an-email", "password": "x"},
        )
        assert response.status_code == 422
        body = response.json()
        assert body["code"] == "validation_error"
        assert "fields" in body
        # Field paths are dotted; the old API returned positional tuples.
        assert all(isinstance(key, str) for key in body["fields"])

    async def test_every_error_uses_the_same_keys(self, make_client):
        """Regression guard: the original API returned whatever key the author
        typed that day ({error}, {notFound}, {provide}, {unauthorized})."""
        for method, path, body in [
            ("get", "/api/events/999999", None),
            ("get", "/api/attendees/me", None),
            ("get", "/api/organizers/me", None),
            ("post", "/api/auth/attendee/login", {"identifier": "x", "password": "y"}),
        ]:
            response = await (
                make_client().get(path) if method == "get" else make_client().post(path, json=body)
            )
            assert response.status_code >= 400, f"{path} unexpectedly succeeded"
            keys = set(response.json())
            assert keys >= {"detail", "code"}, f"{path} returned {keys}"