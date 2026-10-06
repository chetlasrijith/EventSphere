"""Auth tests: signup, login, roles, and the cookie contract."""

from __future__ import annotations

import pytest

from tests.helpers import approve_admin, make_superadmin, register_admin, register_attendee, register_organizer


class TestSignup:
    async def test_attendee_signup_returns_session_and_sets_cookie(self, client):
        response = await client.post(
            "/api/auth/attendee/signup",
            json={
                "username": "alice",
                "email": "alice@example.com",
                "password": "password123",
            },
        )
        assert response.status_code == 201
        body = response.json()
        assert body["role"] == "Attendee"
        assert body["username"] == "alice"
        # The frontend reads this cookie in JS, so it must be set.
        assert "jwt" in response.cookies

    async def test_duplicate_email_is_rejected(self, client):
        payload = {
            "username": "alice",
            "email": "alice@example.com",
            "password": "password123",
        }
        assert (await client.post("/api/auth/attendee/signup", json=payload)).status_code == 201
        payload["username"] = "alice2"
        response = await client.post("/api/auth/attendee/signup", json=payload)
        assert response.status_code == 409
        assert response.json()["code"] == "email_taken"

    async def test_duplicate_username_is_rejected(self, client):
        payload = {
            "username": "alice",
            "email": "alice@example.com",
            "password": "password123",
        }
        assert (await client.post("/api/auth/attendee/signup", json=payload)).status_code == 201
        payload["email"] = "other@example.com"
        response = await client.post("/api/auth/attendee/signup", json=payload)
        assert response.status_code == 409
        assert response.json()["code"] == "username_taken"

    async def test_short_password_is_rejected(self, client):
        response = await client.post(
            "/api/auth/attendee/signup",
            json={"username": "alice", "email": "a@example.com", "password": "short"},
        )
        assert response.status_code == 422
        assert "fields" in response.json()

    async def test_admin_signup_cannot_self_assign_superadmin(self, client):
        """The original form let the requester pick SuperAdmin at signup.

        The role is no longer accepted as input at all; every signup is a
        pending Admin.
        """
        response = await client.post(
            "/api/auth/admin/signup",
            json={
                "username": "mallory",
                "email": "mallory@example.com",
                "password": "password123",
                "role": "SuperAdmin",
            },
        )
        assert response.status_code == 201
        # No cookie: a pending admin cannot use the API.
        assert "jwt" not in response.cookies

    async def test_admin_signup_does_not_set_session(self, client):
        response = await client.post(
            "/api/auth/admin/signup",
            json={
                "username": "admin",
                "email": "admin@example.com",
                "password": "password123",
            },
        )
        assert response.status_code == 201
        assert "jwt" not in response.cookies


class TestLogin:
    async def test_login_by_username(self, client):
        await register_attendee(client, "alice")
        response = await client.post(
            "/api/auth/attendee/login",
            json={"identifier": "alice", "password": "password123"},
        )
        assert response.status_code == 200
        assert response.json()["role"] == "Attendee"

    async def test_login_by_email(self, client):
        await register_attendee(client, "alice")
        response = await client.post(
            "/api/auth/attendee/login",
            json={"identifier": "alice@example.com", "password": "password123"},
        )
        assert response.status_code == 200

    async def test_wrong_password_is_unauthorized(self, client):
        await register_attendee(client, "alice")
        response = await client.post(
            "/api/auth/attendee/login",
            json={"identifier": "alice", "password": "wrongpassword"},
        )
        assert response.status_code == 401
        assert response.json()["code"] == "invalid_credentials"

    async def test_unknown_user_and_wrong_password_are_indistinguishable(self, client):
        """Must not reveal whether an email has an account."""
        await register_attendee(client, "alice")
        unknown = await client.post(
            "/api/auth/attendee/login",
            json={"identifier": "nobody", "password": "password123"},
        )
        wrong = await client.post(
            "/api/auth/attendee/login",
            json={"identifier": "alice", "password": "wrongpassword"},
        )
        assert unknown.status_code == wrong.status_code == 401
        assert unknown.json() == wrong.json()

    async def test_pending_admin_cannot_log_in(self, client, db_session):
        await register_admin(client, "newadmin")
        response = await client.post(
            "/api/auth/admin/login",
            json={"identifier": "newadmin", "password": "password123"},
        )
        assert response.status_code == 403
        assert response.json()["code"] == "admin_not_approved"

    async def test_whitelisted_admin_gets_superadmin_role(self, client, db_session):
        await register_admin(client, "boss", password="password123")
        await approve_admin(db_session, "boss")
        await make_superadmin(db_session, "boss@example.com")
        response = await client.post(
            "/api/auth/admin/login",
            json={"identifier": "boss", "password": "password123"},
        )
        assert response.status_code == 200
        assert response.json()["role"] == "SuperAdmin"

    async def test_non_whitelisted_approved_admin_gets_admin_role(self, client, db_session):
        await register_admin(client, "staff")
        await approve_admin(db_session, "staff")
        response = await client.post(
            "/api/auth/admin/login",
            json={"identifier": "staff", "password": "password123"},
        )
        assert response.json()["role"] == "Admin"

    async def test_organizer_login(self, client):
        await register_organizer(client, "org")
        response = await client.post(
            "/api/auth/organizer/login",
            json={"identifier": "org", "password": "password123"},
        )
        assert response.json()["role"] == "Organizer"


class TestCookieContract:
    async def test_cookie_is_readable_by_javascript(self, client):
        """The React app decodes the JWT in the browser to pick a navbar.

        This is an intentional trade-off; the test pins the behaviour so it
        cannot be changed by accident.
        """
        response = await client.post(
            "/api/auth/attendee/signup",
            json={"username": "alice", "email": "a@example.com", "password": "password123"},
        )
        header = response.headers["set-cookie"]
        assert "jwt=" in header
        # HttpOnly must be absent so document.cookie can read it.
        assert "HttpOnly" not in header

    async def test_role_claim_is_present_in_token(self, client):
        """The frontend reads `role` off the decoded token for route gating."""
        from jose import jwt as jose_jwt

        from app.core.config import settings

        await register_attendee(client, "alice")
        response = await client.post(
            "/api/auth/attendee/login",
            json={"identifier": "alice", "password": "password123"},
        )
        token = response.cookies["jwt"]
        claims = jose_jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        assert claims["role"] == "Attendee"
        assert claims["user_id"] > 0


class TestLogout:
    async def test_logout_clears_cookie(self, client):
        await register_attendee(client, "alice")
        assert client.cookies.get("jwt"), "expected a session cookie before logout"
        response = await client.post("/api/auth/logout")
        assert response.status_code == 200
        # delete_cookie emits an already-expired cookie, so the browser drops
        # it from the jar rather than storing an empty value.
        assert "Max-Age=0" in response.headers["set-cookie"] or (
            "expires=" in response.headers["set-cookie"].lower()
        )
        assert not client.cookies.get("jwt")

    async def test_logout_is_a_post_not_a_get(self, client):
        """A GET logout can be triggered by a prefetch or an <img> tag."""
        await register_attendee(client, "alice")
        response = await client.get("/api/auth/logout")
        assert response.status_code == 405


class TestAuthorisation:
    async def test_protected_route_requires_token(self, client):
        response = await client.get("/api/attendees/me")
        assert response.status_code == 401

    async def test_attendee_token_cannot_use_organizer_route(self, client):
        await register_attendee(client, "alice")
        response = await client.get("/api/organizers/me")
        assert response.status_code == 403
        assert response.json()["code"] == "wrong_role"

    async def test_garbage_token_is_rejected(self, client):
        client.cookies.set("jwt", "not-a-real-token")
        response = await client.get("/api/attendees/me")
        assert response.status_code == 401
        assert response.json()["code"] == "invalid_token"

    async def test_organizer_cannot_use_admin_route(self, client):
        await register_organizer(client, "org")
        response = await client.get("/api/admins/me")
        assert response.status_code == 403