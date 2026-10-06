"""Cookie policy tests.

The session cookie's SameSite and Secure attributes decide whether the app
works once the frontend and API are on different domains, which is exactly the
deployment topology (Vercel + Render). These tests pin the behaviour for both
layouts.
"""

from __future__ import annotations

import importlib

import pytest
from httpx import ASGITransport, AsyncClient
from pydantic import ValidationError

from app.core import config as config_module
from app.main import create_app
from tests.helpers import register_attendee


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


@pytest.fixture
def with_samesite(monkeypatch):
    """Temporarily override settings for the cookie policy.

    Patches the shared settings *instance* rather than reloading the module.
    Reloading would hand every module a different settings object than the one
    imported with `from app.core.config import settings`, which silently breaks
    unrelated tests.
    """

    def _apply(value: str, *, production: bool = True):
        settings = config_module.get_settings()
        monkeypatch.setattr(settings, "cookie_samesite", value.lower())
        monkeypatch.setattr(settings, "environment", "production" if production else "test")
        return settings

    yield _apply


def _set_cookie(response) -> str:
    return response.headers["set-cookie"]


class TestCookiePolicy:
    async def test_same_origin_defaults_to_lax(self, make_client):
        """Local development: one origin, so the stricter policy applies."""
        client = make_client()
        await register_attendee(client, "alice")
        response = await client.post(
            "/api/auth/attendee/login",
            json={"identifier": "alice", "password": "password123"},
        )
        header = _set_cookie(response)
        assert "SameSite=lax" in header or "samesite=lax" in header.lower()

    async def test_secure_follows_environment_for_lax(self, make_client):
        """With SameSite=lax, Secure tracks the environment.

        Local HTTP development must not set Secure, or the browser refuses to
        store the cookie at all.
        """
        settings = config_module.get_settings()
        assert settings.is_production is False

        auth = importlib.import_module("app.services.auth")
        flags = auth._cookie_flags()
        assert flags["samesite"] == "lax"
        assert flags["secure"] is False

    async def test_lax_is_the_value_that_breaks_split_deployments(self, make_client):
        """Documents *why* a split deployment must set COOKIE_SAMESITE=none.

        A Lax cookie is withheld from cross-site fetch calls by every current
        browser, so a Vercel-hosted frontend talking to a Render-hosted API
        would appear to log in and then 401 on every subsequent request.
        """
        auth = importlib.import_module("app.services.auth")
        assert auth._cookie_flags()["samesite"] == "lax"
        # The escape hatch is configuration, not a code change.
        assert hasattr(config_module.get_settings(), "cookie_samesite")

    async def test_none_forces_secure(self, with_samesite):
        """Browsers reject SameSite=None over plain HTTP."""
        settings = with_samesite("none", production=False)
        assert settings.cookie_samesite == "none"

        auth = importlib.import_module("app.services.auth")
        flags = auth._cookie_flags()
        assert flags["samesite"] == "none"
        assert flags["secure"] is True, "SameSite=None must require HTTPS even in dev"

    def test_invalid_samesite_is_rejected_by_settings(self):
        """The validator rejects a typo at startup rather than silently
        defaulting, so a misconfigured deploy fails loudly."""
        with pytest.raises(ValidationError, match="COOKIE_SAMESITE"):
            config_module.Settings(cookie_samesite="bogus")

    @pytest.mark.parametrize("value", ["lax", "strict", "none", "LAX"])
    def test_valid_samesite_values(self, value):
        assert config_module.Settings(cookie_samesite=value).cookie_samesite == value.lower()

    async def test_cookie_remains_readable_by_the_frontend(self, make_client):
        """The React app decodes the JWT client-side to choose its navbar."""
        client = make_client()
        await register_attendee(client, "alice")
        response = await client.post(
            "/api/auth/attendee/login",
            json={"identifier": "alice", "password": "password123"},
        )
        header = _set_cookie(response)
        assert "jwt=" in header
        assert "HttpOnly" not in header

    async def test_logout_clears_with_matching_attributes(self, make_client):
        """delete_cookie must match the original attributes, or the browser
        keeps the original cookie and the user stays signed in."""
        client = make_client()
        await register_attendee(client, "alice")
        response = await client.post("/api/auth/logout")
        header = _set_cookie(response)
        assert "Max-Age=0" in header or "expires=" in header.lower()
        # Path and SameSite must match what set_auth_cookie used.
        assert "Path=/" in header