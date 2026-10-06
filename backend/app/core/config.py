"""Application settings, loaded from environment / .env file."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/app/core/config.py -> backend/
BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Database ---
    database_url: str = (
        "postgresql+asyncpg://eventsphere:eventsphere@localhost:5432/eventsphere"
    )

    # --- Auth ---
    jwt_secret: str = "insecure-development-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_days: int = 15

    # Cookie name. The React frontend reads this cookie via js-cookie to read the
    # role claim, so the name is part of the client contract -- do not rename.
    jwt_cookie_name: str = "jwt"

    # 'lax'  -- API and frontend on the same origin (local dev, single service)
    # 'none' -- API on a different domain than the frontend (Vercel + Render).
    #           Required, because browsers withhold a Lax cookie from
    #           cross-site fetch calls, which would break every authenticated
    #           request. Requires HTTPS, so `secure` is forced on.
    cookie_samesite: str = "lax"

    # --- App ---
    environment: str = "development"
    debug: bool = True
    cors_origins: str = "http://localhost:5173"

    # --- Cloudinary ---
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""

    @field_validator("jwt_secret")
    @classmethod
    def _reject_default_secret(cls, value: str) -> str:
        if value in {
            "insecure-development-secret-change-me",
            "replace-me-with-a-long-random-string",
        }:
            msg = (
                "JWT_SECRET is missing or still uses an example value. Set a "
                "unique random value in backend/.env or the deployment environment."
            )
            raise ValueError(msg)
        return value

    @field_validator("cookie_samesite")
    @classmethod
    def _valid_samesite(cls, value: str) -> str:
        allowed = {"lax", "strict", "none"}
        if value.lower() not in allowed:
            msg = f"COOKIE_SAMESITE must be one of {sorted(allowed)}, got {value!r}"
            raise ValueError(msg)
        return value.lower()

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def cloudinary_configured(self) -> bool:
        return all(
            (
                self.cloudinary_cloud_name,
                self.cloudinary_api_key,
                self.cloudinary_api_secret,
            )
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()