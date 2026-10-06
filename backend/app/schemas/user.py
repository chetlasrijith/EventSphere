"""Auth and user schemas."""

from __future__ import annotations

from datetime import date, datetime
from typing import Annotated

from pydantic import BaseModel, EmailStr, Field

from app.models.enums import AdminStatus, UserRole
from app.schemas.common import APIModel, ORMModel, AddressBase

Password = Annotated[str, Field(min_length=6, max_length=128)]
MobileNumber = Annotated[str, Field(pattern=r"^\d{10}$")]
Username = Annotated[str, Field(min_length=3, max_length=80)]


# --------------------------------------------------------------------------- #
# Attendee
# --------------------------------------------------------------------------- #


class AttendeeSignup(APIModel):
    username: Username
    email: EmailStr
    password: Password
    mobile_number: MobileNumber | None = None


class AttendeeLogin(APIModel):
    identifier: str = Field(min_length=1, description="Username or email")
    password: str = Field(min_length=1)


class AttendeeUpdate(APIModel):
    username: Username | None = None
    email: EmailStr | None = None
    mobile_number: MobileNumber | None = None


class AttendeeOut(ORMModel):
    id: int
    username: str
    email: EmailStr
    mobile_number: str | None
    profile_img: str
    created_at: datetime


# --------------------------------------------------------------------------- #
# Organizer
# --------------------------------------------------------------------------- #


class ExperienceIn(APIModel):
    organization: str = Field(min_length=1, max_length=150)
    years: int = Field(default=0, ge=0, le=100)
    months: int = Field(default=0, ge=0, le=11)


class ExperienceOut(ORMModel):
    id: int
    organization: str
    years: int
    months: int


class OrganizerSignup(APIModel):
    username: Username
    email: EmailStr
    password: Password
    mobile_number: MobileNumber
    address: AddressBase


class OrganizerLogin(APIModel):
    identifier: str = Field(min_length=1, description="Username or email")
    password: str = Field(min_length=1)


class OrganizerUpdate(APIModel):
    username: Username | None = None
    email: EmailStr | None = None
    mobile_number: MobileNumber | None = None
    password: Password | None = None
    address: AddressBase | None = None
    about: str | None = Field(default=None, max_length=300)


class OrganizerBrief(ORMModel):
    """Public-facing subset -- never exposes the email to other users."""

    id: int
    username: str
    profile_img: str
    cover_image: str
    about: str | None
    rating: float
    event_count: int


class OrganizerAdminOut(ORMModel):
    """Admin-facing view of an organizer, flattened for the admin list page."""

    id: int
    username: str
    email: EmailStr
    mobile_number: str | None
    profile_img: str
    cover_image: str
    about: str | None
    rating: float
    event_count: int
    street: str
    city: str
    state: str
    postal_code: str
    country: str
    experiences: list[ExperienceOut] = Field(default_factory=list)
    achievements: list[str] = Field(default_factory=list)
    created_at: datetime


# --------------------------------------------------------------------------- #
# Admin
# --------------------------------------------------------------------------- #


class AdminSignup(APIModel):
    """Admin self-registration.

    There is deliberately no `role` field. The original form let the requester
    pick 'SuperAdmin' at signup, which was self-escalation. Signup always
    creates a pending Admin; escalation happens only through the whitelist.
    """

    username: Username
    email: EmailStr
    password: Password
    mobile_number: MobileNumber | None = None


class AdminLogin(APIModel):
    identifier: str = Field(min_length=1, description="Username or email")
    password: str = Field(min_length=1)


class AdminUpdate(APIModel):
    username: Username | None = None
    email: EmailStr | None = None
    password: Password | None = None


class AdminOut(ORMModel):
    id: int
    username: str
    email: EmailStr
    mobile_number: str | None
    status: AdminStatus
    created_at: datetime


class AdminWithRole(AdminOut):
    role: UserRole


class AdminDecision(APIModel):
    reason: str | None = Field(default=None, max_length=500)


# --------------------------------------------------------------------------- #
# Artist
# --------------------------------------------------------------------------- #


class SocialLinks(APIModel):
    website: str | None = None
    instagram: str | None = None
    twitter: str | None = None


class ArtistCreate(APIModel):
    artist_name: str = Field(min_length=1, max_length=120)
    genre: str = Field(min_length=1, max_length=120)
    bio: str | None = Field(default=None, max_length=5000)
    birth_date: date | None = None
    social_links: SocialLinks = Field(default_factory=SocialLinks)


class ArtistOut(ORMModel):
    id: int
    artist_name: str
    genre: str
    bio: str
    image: str
    birth_date: date | None
    website: str | None
    instagram: str | None
    twitter: str | None


# --------------------------------------------------------------------------- #
# Session
# --------------------------------------------------------------------------- #


class SessionOut(APIModel):
    """Returned by every login endpoint."""

    role: UserRole
    id: int
    username: str
    email: EmailStr | None = None


class AuthErrorOut(APIModel):
    detail: str
    code: str