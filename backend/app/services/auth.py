"""Signup / login / logout service logic shared by the three roles."""

from __future__ import annotations

from typing import Any, TypeVar

from fastapi import Response
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.errors import ConflictError, ForbiddenError, UnauthorizedError
from app.core.security import create_access_token, hash_password, verify_password
from app.models.enums import AdminStatus, UserRole
from app.models.user import Admin, Attendee, Organizer, SuperAdminWhitelist

ModelT = TypeVar("ModelT", bound=Attendee)


def _cookie_flags() -> dict:
    """Cookie attributes shared by set and clear.

    SameSite is configurable because it depends on deployment topology:

    * Same origin (API serving the frontend) -> `lax` is fine and stricter.
    * Split origin (Vercel frontend + Render API) -> the browser treats the
      API as a different site, and a `lax` cookie is NOT sent on cross-site
      `fetch` calls. Every authenticated request would 401 despite a
      successful login. This requires `none`, which browsers only honour over
      HTTPS, hence `secure` being forced on.

    `httpOnly` stays False: the React frontend reads this cookie in JavaScript
    via js-cookie to obtain the role claim. An httpOnly cookie would require a
    round-trip to /auth/me on every page load. The token is signed, so
    tampering with it changes the decoded role but never grants server-side
    access -- every request is authorised again on the backend.
    """
    samesite = settings.cookie_samesite.lower()
    return {
        "httponly": False,
        "samesite": samesite,
        # SameSite=None is only honoured over HTTPS.
        "secure": settings.is_production or samesite == "none",
        "path": "/",
    }


def set_auth_cookie(response: Response, token: str) -> None:
    """Attach the JWT cookie. See `_cookie_flags` for the trade-offs."""
    response.set_cookie(
        key=settings.jwt_cookie_name,
        value=token,
        max_age=settings.access_token_expire_days * 24 * 60 * 60,
        **_cookie_flags(),
    )


def clear_auth_cookie(response: Response) -> None:
    """Expire the cookie.

    The attributes must match those used when setting it, or the browser treats
    it as a different cookie and leaves the original in place.
    """
    response.delete_cookie(key=settings.jwt_cookie_name, **_cookie_flags())


async def _ensure_unique(
    session: AsyncSession,
    model: type[ModelT],
    *,
    email: str,
    username: str,
) -> None:
    existing = await session.scalar(
        select(model).where(or_(model.email == email, model.username == username))  # type: ignore[attr-defined]
    )
    if existing is None:
        return
    # Distinguish the two cases so the caller can show a useful message.
    if existing.email == email:  # type: ignore[attr-defined]
        raise ConflictError("An account with this email already exists", code="email_taken")
    raise ConflictError("This username is already taken", code="username_taken")


async def signup_attendee(
    session: AsyncSession, payload: Any
) -> Attendee:
    await _ensure_unique(session, Attendee, email=payload.email, username=payload.username)
    attendee = Attendee(
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
        mobile_number=payload.mobile_number,
    )
    session.add(attendee)
    await session.commit()
    await session.refresh(attendee)
    return attendee


async def signup_organizer(session: AsyncSession, payload: Any) -> Organizer:
    await _ensure_unique(session, Organizer, email=payload.email, username=payload.username)
    address = payload.address
    organizer = Organizer(
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
        mobile_number=payload.mobile_number,
        street=address.street,
        city=address.city,
        state=address.state,
        postal_code=address.postal_code,
        country=address.country,
    )
    session.add(organizer)
    await session.commit()
    await session.refresh(organizer)
    return organizer


async def signup_admin(session: AsyncSession, payload: Any) -> Admin:
    """Create a *pending* Admin. Role escalation is never possible here."""
    await _ensure_unique(session, Admin, email=payload.email, username=payload.username)
    admin = Admin(
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
        mobile_number=payload.mobile_number,
        status=AdminStatus.PENDING,
    )
    session.add(admin)
    await session.commit()
    await session.refresh(admin)
    return admin


async def _find_by_identifier(session: AsyncSession, model: Any, identifier: str) -> Any:
    return await session.scalar(
        select(model).where(
            or_(
                func.lower(model.username) == identifier.lower(),  # type: ignore[attr-defined]
                func.lower(model.email) == identifier.lower(),  # type: ignore[attr-defined]
            )
        )
    )


async def login_attendee(
    session: AsyncSession, identifier: str, password: str
) -> tuple[Attendee, str]:
    user = await _find_by_identifier(session, Attendee, identifier)
    # Same error for unknown user and bad password: don't leak which emails
    # have accounts.
    if user is None or not verify_password(password, user.password_hash):
        raise UnauthorizedError("Invalid credentials", code="invalid_credentials")
    return user, create_access_token(user.id, UserRole.ATTENDEE)


async def login_organizer(
    session: AsyncSession, identifier: str, password: str
) -> tuple[Organizer, str]:
    user = await _find_by_identifier(session, Organizer, identifier)
    if user is None or not verify_password(password, user.password_hash):
        raise UnauthorizedError("Invalid credentials", code="invalid_credentials")
    return user, create_access_token(user.id, UserRole.ORGANIZER)


async def login_admin(
    session: AsyncSession, identifier: str, password: str
) -> tuple[Admin, UserRole, str]:
    """Authenticate an admin and resolve whether they are also a SuperAdmin.

    The token's role claim reflects the whitelist, so revoking a SuperAdmin's
    whitelist entry invalidates their privileges on the next request.
    """
    user = await _find_by_identifier(session, Admin, identifier)
    if user is None or not verify_password(password, user.password_hash):
        raise UnauthorizedError("Invalid credentials", code="invalid_credentials")
    if user.status is not AdminStatus.APPROVED:
        raise ForbiddenError(
            "Your admin account has not been approved yet", code="admin_not_approved"
        )
    whitelisted = await session.scalar(
        select(SuperAdminWhitelist.id).where(SuperAdminWhitelist.email == user.email)
    )
    role = UserRole.SUPERADMIN if whitelisted else UserRole.ADMIN
    return user, role, create_access_token(user.id, role)