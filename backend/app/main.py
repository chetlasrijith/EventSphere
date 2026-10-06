"""FastAPI application factory."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import HTTPException, RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import api_router
from app.core import cloudinary
from app.core.config import settings
from app.core.errors import (
    APIError,
    http_error_handler,
    validation_error_handler,
)
from app.db.session import dispose_engine

logger = logging.getLogger("eventsphere")

DESCRIPTION = """
EventSphere API.

Authentication is cookie-based: logging in sets an `HttpOnly=False` cookie named
`jwt` containing a 15-day JWT. The React frontend reads that cookie in
JavaScript to determine the caller's role, which is why the cookie is readable
by scripts.

Three roles are supported:

* **Attendee** — browse events, register, obtain tickets
* **Organizer** — create and manage their own events, message admins
* **Admin / SuperAdmin** — approve events, manage organizers, approve admins
"""


@asynccontextmanager
async def lifespan(app: FastAPI):
    cloudinary.configure()
    logger.info("EventSphere API starting (environment=%s)", settings.environment)
    yield
    await dispose_engine()
    logger.info("EventSphere API shutting down")


def create_app() -> FastAPI:
    app = FastAPI(
        title="EventSphere API",
        description=DESCRIPTION,
        version="2.0.0",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # Credentials must be enabled or the browser drops the jwt cookie.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Explicit handlers keep every error body in the same {detail, code} shape.
    app.add_exception_handler(APIError, http_error_handler)  # type: ignore[arg-type]
    app.add_exception_handler(HTTPException, http_error_handler)  # type: ignore[arg-type]
    app.add_exception_handler(RequestValidationError, validation_error_handler)  # type: ignore[arg-type]

    @app.get("/health", tags=["meta"])
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(api_router)

    return app


app = create_app()