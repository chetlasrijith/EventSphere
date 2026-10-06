"""Authentication and authorisation dependencies."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ForbiddenError, UnauthorizedError
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.user import Admin, AdminStatus, Attendee, Organizer, SuperAdminWhitelist

DbSession = Annotated[AsyncSession, Depends(get_db)]


def _token_from_request(request: Request) -> str | None:
    token = request.cookies.get("jwt")
    if token:
        return token
    # Accept the Authorization header too, which makes the API usable from
    # non-browser clients and test suites.
    header = request.headers.get("authorization")
    if header and header.lower().startswith("bearer "):
        return header[7:]
    return None


async def resolve_session(
    request: Request, session: AsyncSession
) -> tuple[int, UserRole]:
    """Validate the token and return (user_id, role) for any role.

    Does not touch the database, so the caller must still confirm the account
    exists and is in good standing.
    """
    token = _token_from_request(request)
    if not token:
        raise UnauthorizedError("No authentication token provided", code="no_token")

    payload = decode_access_token(token)
    if payload is None:
        raise UnauthorizedError(
            "Invalid or expired token. Please log in again.", code="invalid_token"
        )

    raw_id = payload.get("user_id") or payload.get("sub")
    raw_role = payload.get("role")
    try:
        user_id = int(raw_id)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        raise UnauthorizedError("Malformed token subject", code="invalid_token") from None

    if raw_role not in {role.value for role in UserRole}:
        raise UnauthorizedError("Malformed token role", code="invalid_token")

    return user_id, UserRole(raw_role)


async def get_current_attendee(
    request: Request, session: DbSession
) -> Attendee:
    user_id, role = await resolve_session(request, session)
    if role is not UserRole.ATTENDEE:
        raise ForbiddenError("This endpoint is for attendees", code="wrong_role")
    user = await session.get(Attendee, user_id)
    if user is None:
        raise UnauthorizedError("Attendee account no longer exists", code="user_gone")
    return user


async def get_current_organizer(
    request: Request, session: DbSession
) -> Organizer:
    user_id, role = await resolve_session(request, session)
    if role is not UserRole.ORGANIZER:
        raise ForbiddenError("This endpoint is for organizers", code="wrong_role")
    user = await session.get(Organizer, user_id)
    if user is None:
        raise UnauthorizedError("Organizer account no longer exists", code="user_gone")
    return user


async def _get_admin(request: Request, session: AsyncSession) -> tuple[Admin, bool]:
    user_id, role = await resolve_session(request, session)
    if role not in (UserRole.ADMIN, UserRole.SUPERADMIN):
        raise ForbiddenError("This endpoint is for admins", code="wrong_role")
    admin = await session.get(Admin, user_id)
    if admin is None:
        raise UnauthorizedError("Admin account no longer exists", code="user_gone")
    if admin.status is not AdminStatus.APPROVED:
        raise ForbiddenError(
            "Your admin account is not approved yet", code="admin_not_approved"
        )
    # SuperAdmin is derived from the whitelist rather than stored on the row, so
    # revoking whitelist access takes effect immediately.
    whitelisted = await session.scalar(
        select(SuperAdminWhitelist.id).where(SuperAdminWhitelist.email == admin.email)
    )
    return admin, whitelisted is not None


async def get_current_admin(request: Request, session: DbSession) -> Admin:
    admin, _ = await _get_admin(request, session)
    return admin


async def get_current_superadmin(request: Request, session: DbSession) -> Admin:
    admin, is_super = await _get_admin(request, session)
    if not is_super:
        raise ForbiddenError("SuperAdmin privileges required", code="not_superadmin")
    return admin


CurrentAttendee = Annotated[Attendee, Depends(get_current_attendee)]
CurrentOrganizer = Annotated[Organizer, Depends(get_current_organizer)]
CurrentAdmin = Annotated[Admin, Depends(get_current_admin)]
CurrentSuperAdmin = Annotated[Admin, Depends(get_current_superadmin)]


