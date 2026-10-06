"""Guards against drift between the models and the Alembic migrations.

The test suite builds tables with `create_all`, while development and
production use Alembic. That gap let a real bug ship once already: a stale
foreign key on `notifications.sender_id` existed in the migration but not in the
model, so the API 500'd in development while every test passed. This test
compares the two and fails on any divergence.
"""

from __future__ import annotations

import pytest
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from sqlalchemy import create_engine

from app.core.config import settings
from app.db.base import Base

# Importing the model package registers every table on Base.metadata.
import app.models  # noqa: F401

# The sync driver is used only for schema introspection (Alembic compare).
# It is a dev/test dependency; the app itself runs entirely on asyncpg.
SYNC_URL = settings.database_url.replace("+asyncpg", "")


@pytest.fixture(scope="module")
def connection():
    engine = create_engine(SYNC_URL)
    with engine.connect() as conn:
        yield conn
    engine.dispose()


def test_migrations_match_models(connection):
    context = MigrationContext.configure(connection)
    diff = compare_metadata(context, Base.metadata)

    # Timestamps and server defaults are environment-specific; only structural
    # drift (missing/extra tables, columns, indexes, constraints) matters here.
    ignored_suffixes = ("_created_at", "_updated_at")

    problems: list[str] = []
    for change in diff:
        kind = change[0]
        if kind == "remove_table":
            problems.append(f"table in migration but not in models: {change[1].name}")
        elif kind == "add_table":
            problems.append(f"table in models but not in migration: {change[1].name}")
        elif kind == "add_column":
            problems.append(
                f"column in models but not in migration: {change[2].table.name}.{change[1].name}"
            )
        elif kind == "remove_column":
            problems.append(
                f"column in migration but not in models: {change[2].table.name}.{change[1].name}"
            )
        elif kind in ("add_index", "remove_index"):
            problems.append(f"index drift: {kind} {change[1].name}")
        elif kind in ("add_constraint", "remove_constraint"):
            problems.append(f"constraint drift: {kind}")

    problems = [p for p in problems if not p.endswith(ignored_suffixes)]
    assert not problems, (
        "Models and migrations have diverged. Run `alembic revision --autogenerate`.\n  "
        + "\n  ".join(problems)
    )