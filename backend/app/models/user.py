"""User tables: attendees, organizers, admins, and the superadmin whitelist."""

from __future__ import annotations

import datetime
from datetime import date

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.enums import AdminStatus, UserRole, enum_values

MOBILE_RE = r"^\d{10}$"


class Attendee(Base, TimestampMixin):
    __tablename__ = "attendees"
    __table_args__ = (
        UniqueConstraint("username", name="uq_attendees_username"),
        UniqueConstraint("email", name="uq_attendees_email"),
        CheckConstraint(f"mobile_number IS NULL OR mobile_number ~ '{MOBILE_RE}'", name="mobile_10_digits"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(80), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    mobile_number: Mapped[str | None] = mapped_column(String(20))
    profile_img: Mapped[str] = mapped_column(String(500), default="", server_default="")

    registrations: Mapped[list["EventRegistration"]] = relationship(  # noqa: F821
        back_populates="attendee", cascade="all, delete-orphan", lazy="selectin"
    )
    tickets: Mapped[list["Ticket"]] = relationship(  # noqa: F821
        back_populates="attendee", cascade="all, delete-orphan", lazy="selectin"
    )


class Experience(Base):
    __tablename__ = "organizer_experience"
    __table_args__ = (
        CheckConstraint("years >= 0 AND years <= 100", name="years_range"),
        CheckConstraint("months >= 0 AND months <= 11", name="months_range"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    organization: Mapped[str] = mapped_column(String(150), nullable=False)
    years: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    months: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    organizer_id: Mapped[int] = mapped_column(
        ForeignKey("organizers.id", ondelete="CASCADE"), nullable=False, index=True
    )


class Achievement(Base):
    __tablename__ = "organizer_achievements"
    __table_args__ = (CheckConstraint("char_length(text) <= 200", name="max_200_chars"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)

    organizer_id: Mapped[int] = mapped_column(
        ForeignKey("organizers.id", ondelete="CASCADE"), nullable=False, index=True
    )


class AddressMixin:
    """Shared address columns.

    Embedded as columns rather than a separate table: addresses are always
    required alongside their parent and never queried independently.
    """

    street: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(120), nullable=False)
    state: Mapped[str] = mapped_column(String(120), nullable=False)
    postal_code: Mapped[str] = mapped_column(String(20), nullable=False)
    country: Mapped[str] = mapped_column(String(120), nullable=False)


class Organizer(Base, TimestampMixin, AddressMixin):
    __tablename__ = "organizers"
    __table_args__ = (
        UniqueConstraint("username", name="uq_organizers_username"),
        UniqueConstraint("email", name="uq_organizers_email"),
        CheckConstraint(
            f"mobile_number IS NULL OR mobile_number ~ '{MOBILE_RE}'", name="mobile_10_digits"
        ),
        CheckConstraint("char_length(about) <= 300", name="about_max_300"),
        CheckConstraint("rating >= 0 AND rating <= 5", name="rating_range"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(80), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    mobile_number: Mapped[str | None] = mapped_column(String(20))
    profile_img: Mapped[str] = mapped_column(String(500), default="", server_default="")
    cover_image: Mapped[str] = mapped_column(String(500), default="", server_default="")
    about: Mapped[str | None] = mapped_column(Text)
    rating: Mapped[float] = mapped_column(Float, default=0.0, server_default="0")
    event_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0")

    experiences: Mapped[list[Experience]] = relationship(
        back_populates="organizer",
        cascade="all, delete-orphan",
        order_by="Experience.id",
        lazy="selectin",
    )
    achievements: Mapped[list[Achievement]] = relationship(
        back_populates="organizer",
        cascade="all, delete-orphan",
        order_by="Achievement.id",
        lazy="selectin",
    )
    events: Mapped[list["Event"]] = relationship(  # noqa: F821
        back_populates="organizer", lazy="noload"
    )


# Back-population targets declared after the fact to keep the relationship
# definitions readable above.
Experience.organizer = relationship("Organizer", back_populates="experiences")  # type: ignore[attr-defined]
Achievement.organizer = relationship("Organizer", back_populates="achievements")  # type: ignore[attr-defined]


class Admin(Base, TimestampMixin):
    """Admin account.

    Note: the column is `username`, not `name`. The original schema used `name`
    while the controllers and the signup form both used `username`, so admin
    signup never actually persisted a display name. Aligning on `username` also
    matches the login payload the frontend already sends.

    `role` may only ever hold ADMIN here. SuperAdmin is not storable in this
    column -- it is granted by whitelisting an email, and resolved at
    authentication time. The original code let a signup request pick its own
    role, which meant anyone could self-register as SuperAdmin.
    """

    __tablename__ = "admins"
    __table_args__ = (
        UniqueConstraint("email", name="uq_admins_email"),
        # Defence in depth: even a bug elsewhere cannot store SuperAdmin here.
        CheckConstraint("role <> 'SuperAdmin'", name="role_never_superadmin"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    mobile_number: Mapped[str | None] = mapped_column(String(20))
    # Column is named 'role' to match the JWT claim the frontend reads.
    role: Mapped[UserRole] = mapped_column(
        Enum(
            UserRole,
            name="user_role",
            native_enum=False,
            length=20,
            # Persist the enum *value* ('Admin'), not the Python name ('ADMIN'),
            # so the stored text matches the role claim in the JWT cookie.
            values_callable=enum_values,
        ),
        default=UserRole.ADMIN,
        server_default=UserRole.ADMIN.value,
        nullable=False,
    )
    status: Mapped[AdminStatus] = mapped_column(
        Enum(AdminStatus, name="admin_status", values_callable=enum_values),
        default=AdminStatus.PENDING,
        server_default=AdminStatus.PENDING.value,
        nullable=False,
    )
    approved_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("admins.id", ondelete="SET NULL")
    )
    approved_at: Mapped[datetime.datetime | None] = mapped_column(DateTime(timezone=True))


class SuperAdminWhitelist(Base):
    """Emails permitted to hold the SuperAdmin role.

    SuperAdmin is never assigned at signup: an account's role is escalated only
    by an existing SuperAdmin. This table is that allowlist.
    """

    __tablename__ = "superadmin_whitelist"
    __table_args__ = (UniqueConstraint("email", name="uq_superadmin_whitelist_email"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Artist(Base, TimestampMixin):
    __tablename__ = "artists"
    __table_args__ = (CheckConstraint("birth_date <= CURRENT_DATE", name="not_future"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    artist_name: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    genre: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    bio: Mapped[str] = mapped_column(Text, default="No bio available", server_default="No bio available")
    image: Mapped[str] = mapped_column(String(500), default="", server_default="")
    birth_date: Mapped[date | None] = mapped_column(Date)
    website: Mapped[str | None] = mapped_column(String(500))
    instagram: Mapped[str | None] = mapped_column(String(500))
    twitter: Mapped[str | None] = mapped_column(String(500))


__all__ = [
    "Attendee",
    "Organizer",
    "Admin",
    "SuperAdminWhitelist",
    "Artist",
    "Experience",
    "Achievement",
    "AddressMixin",
    "MOBILE_RE",
]