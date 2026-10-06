"""Authentication routes for all three roles."""

from __future__ import annotations

from fastapi import APIRouter, Request, Response, status

from app.api.deps.auth import DbSession, resolve_session
from app.core.errors import UnauthorizedError
from app.models.enums import UserRole
from app.models.user import Admin, Attendee, Organizer
from app.schemas.user import (
    AdminLogin,
    AdminSignup,
    AttendeeLogin,
    AttendeeSignup,
    OrganizerLogin,
    OrganizerSignup,
    SessionOut,
)
from app.core.security import create_access_token
from app.services import auth as auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _session(role: UserRole, user) -> SessionOut:
    return SessionOut(
        role=role,
        id=user.id,
        username=user.username,
        email=user.email,
    )


# --------------------------------------------------------------------------- #
# Attendee
# --------------------------------------------------------------------------- #


@router.post(
    "/attendee/signup",
    response_model=SessionOut,
    status_code=status.HTTP_201_CREATED,
)
async def attendee_signup(payload: AttendeeSignup, response: Response, session: DbSession):
    user = await auth_service.signup_attendee(session, payload)
    token = create_access_token(user.id, UserRole.ATTENDEE)
    auth_service.set_auth_cookie(response, token)
    return _session(UserRole.ATTENDEE, user)


@router.post("/attendee/login", response_model=SessionOut)
async def attendee_login(payload: AttendeeLogin, response: Response, session: DbSession):
    user, token = await auth_service.login_attendee(
        session, payload.identifier, payload.password
    )
    auth_service.set_auth_cookie(response, token)
    return _session(UserRole.ATTENDEE, user)


# --------------------------------------------------------------------------- #
# Organizer
# --------------------------------------------------------------------------- #


@router.post(
    "/organizer/signup",
    response_model=SessionOut,
    status_code=status.HTTP_201_CREATED,
)
async def organizer_signup(payload: OrganizerSignup, response: Response, session: DbSession):
    user = await auth_service.signup_organizer(session, payload)
    token = create_access_token(user.id, UserRole.ORGANIZER)
    auth_service.set_auth_cookie(response, token)
    return _session(UserRole.ORGANIZER, user)


@router.post("/organizer/login", response_model=SessionOut)
async def organizer_login(payload: OrganizerLogin, response: Response, session: DbSession):
    user, token = await auth_service.login_organizer(
        session, payload.identifier, payload.password
    )
    auth_service.set_auth_cookie(response, token)
    return _session(UserRole.ORGANIZER, user)


# --------------------------------------------------------------------------- #
# Admin
# --------------------------------------------------------------------------- #


@router.post(
    "/admin/signup",
    response_model=SessionOut,
    status_code=status.HTTP_201_CREATED,
)
async def admin_signup(payload: AdminSignup, response: Response, session: DbSession):
    """Create a pending Admin. Does not sign the user in.

    A new admin cannot use the API until a SuperAdmin approves them, so no
    session cookie is issued here.
    """
    user = await auth_service.signup_admin(session, payload)
    return _session(UserRole.ADMIN, user)


@router.post("/admin/login", response_model=SessionOut)
async def admin_login(payload: AdminLogin, response: Response, session: DbSession):
    user, role, token = await auth_service.login_admin(
        session, payload.identifier, payload.password
    )
    auth_service.set_auth_cookie(response, token)
    return _session(role, user)


# --------------------------------------------------------------------------- #
# Shared
# --------------------------------------------------------------------------- #


@router.post("/logout")
async def logout(response: Response):
    """Clear the session cookie.

    POST rather than the original GET, so a prefetch or an <img> tag cannot log
    a user out.
    """
    auth_service.clear_auth_cookie(response)
    return {"detail": "Logged out"}


@router.get("/me", response_model=SessionOut)
async def current_session(request, session: DbSession):
    """Report the caller's identity and role.

    The React app does not use this -- it reads the JWT cookie directly to pick
    a navbar. It exists for non-browser clients that would rather not decode the
    token themselves.
    """
    user_id, role = await resolve_session(request, session)
    model = {
        UserRole.ATTENDEE: Attendee,
        UserRole.ORGANIZER: Organizer,
        UserRole.ADMIN: Admin,
        UserRole.SUPERADMIN: Admin,
    }[role]
    user = await session.get(model, user_id)
    if user is None:
        raise UnauthorizedError("Account no longer exists", code="user_gone")
    return _session(role, user)