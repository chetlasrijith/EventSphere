"""Test fixtures.

Tests run against a real Postgres database (`eventsphere_test`) so that
constraints, `SELECT ... FOR UPDATE`, and array columns all behave as they do in
production. SQLite would not exercise any of those.

Start the database first:
    docker compose up -d
    docker exec eventsphere-db psql -U eventsphere -d postgres \\
        -c "CREATE DATABASE eventsphere_test;"

Then:
    cd backend && python -m pytest
"""

from __future__ import annotations

import os
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://eventsphere:eventsphere@localhost:5432/eventsphere_test",
)
os.environ.setdefault("JWT_SECRET", "test-secret-not-for-production-use-only")
os.environ.setdefault("ENVIRONMENT", "test")

from app.core.config import settings  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.session import SessionLocal, engine  # noqa: E402
from app.main import create_app  # noqa: E402

TABLES_IN_DELETE_ORDER = (
    "notifications",
    "tickets",
    "event_registrations",
    "events",
    "organizer_achievements",
    "organizer_experience",
    "organizers",
    "attendees",
    "artists",
    "admins",
    "superadmin_whitelist",
)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def _schema() -> AsyncGenerator[None, None]:
    """Create all tables once for the session."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


@pytest_asyncio.fixture(autouse=True)
async def _clean_tables(_schema: None) -> AsyncGenerator[None, None]:
    """Truncate every table between tests, leaving the schema in place."""
    async with engine.begin() as conn:
        await conn.execute(
            text(
                "TRUNCATE "
                + ", ".join(TABLES_IN_DELETE_ORDER)
                + " RESTART IDENTITY CASCADE"
            )
        )
    yield


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """HTTP client bound to the app in-process.

    `raise_app_exceptions` stays True so an unexpected 500 fails the test instead
    of being converted into a tidy error response.
    """
    app = create_app()
    transport = ASGITransport(app=app, raise_app_exceptions=True)
    async with AsyncClient(transport=transport, base_url="http://testserver") as async_client:
        yield async_client