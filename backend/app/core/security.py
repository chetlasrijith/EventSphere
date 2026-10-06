"""Password hashing and JWT helpers."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.models.enums import UserRole

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed)
    except ValueError:
        # Malformed hash in the DB; treat as a failed login rather than a 500.
        return False


def create_access_token(user_id: int, role: UserRole) -> str:
    """Sign a JWT carrying the user id and role.

    The role claim is read by the React frontend (js-cookie + jwt-decode) to
    choose the navbar and gate routes, so both `sub` and `role` are part of the
    client contract.
    """
    now = datetime.now(timezone.utc)
    expires = now + timedelta(days=settings.access_token_expire_days)
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "user_id": user_id,
        "role": role.value,
        "iat": int(now.timestamp()),
        "exp": int(expires.timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any] | None:
    """Return the decoded payload, or None if the token is invalid or expired."""
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return None