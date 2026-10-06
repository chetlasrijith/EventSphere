"""Profile reads and updates for organizers and attendees."""

from __future__ import annotations

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.cloudinary import delete_image, upload_image
from app.core.errors import ConflictError, NotFoundError
from app.core.security import hash_password
from app.models.user import Achievement, Attendee, Experience, Organizer


async def _ensure_available(
    session: AsyncSession,
    model: type,
    *,
    user_id: int,
    username: str | None,
    email: str | None,
) -> None:
    if not username and not email:
        return
    conditions = []
    if username:
        conditions.append(model.username == username)  # type: ignore[attr-defined]
    if email:
        conditions.append(model.email == email)  # type: ignore[attr-defined]
    clash = await session.scalar(
        select(model)
        .where(or_(*conditions), model.id != user_id)  # type: ignore[attr-defined]
    )
    if clash is not None:
        field = "email" if email and clash.email == email else "username"  # type: ignore[attr-defined]
        raise ConflictError(f"That {field} is already in use", code=f"{field}_taken")


async def update_attendee(
    session: AsyncSession, attendee: Attendee, data: dict
) -> Attendee:
    username = data.get("username")
    email = str(data["email"]) if data.get("email") else None
    await _ensure_available(
        session, Attendee, user_id=attendee.id, username=username, email=email
    )
    if username:
        attendee.username = username
    if email:
        attendee.email = email
    if "mobile_number" in data:
        attendee.mobile_number = data["mobile_number"]
    await session.commit()
    await session.refresh(attendee)
    return attendee


async def set_attendee_profile_image(
    session: AsyncSession, attendee: Attendee, data: bytes
) -> str:
    url = await upload_image(data, kind="profile")
    if attendee.profile_img:
        await delete_image(attendee.profile_img, kind="profile")
    attendee.profile_img = url
    await session.commit()
    await session.refresh(attendee)
    return url


async def update_organizer(
    session: AsyncSession, organizer: Organizer, data: dict
) -> Organizer:
    username = data.get("username")
    email = str(data["email"]) if data.get("email") else None
    await _ensure_available(
        session, Organizer, user_id=organizer.id, username=username, email=email
    )

    if username:
        organizer.username = username
    if email:
        organizer.email = email
    if data.get("mobile_number") is not None:
        organizer.mobile_number = data["mobile_number"]
    if data.get("about") is not None:
        organizer.about = data["about"]
    if data.get("password"):
        organizer.password_hash = hash_password(data["password"])

    address = data.get("address")
    if address:
        organizer.street = address["street"]
        organizer.city = address["city"]
        organizer.state = address["state"]
        organizer.postal_code = address["postal_code"]
        organizer.country = address["country"]

    await session.commit()
    await session.refresh(organizer)
    return organizer


async def set_organizer_image(
    session: AsyncSession, organizer: Organizer, *, kind: str, data: bytes
) -> str:
    """Replace a profile or cover image, deleting the previous upload."""
    if kind == "profile":
        url = await upload_image(data, kind="profile")
        if organizer.profile_img:
            await delete_image(organizer.profile_img, kind="profile")
        organizer.profile_img = url
    elif kind == "cover":
        url = await upload_image(data, kind="cover")
        if organizer.cover_image:
            await delete_image(organizer.cover_image, kind="cover")
        organizer.cover_image = url
    else:
        raise NotFoundError("Unknown image kind", code="unknown_image_kind")

    await session.commit()
    await session.refresh(organizer)
    return url


async def set_experience(
    session: AsyncSession, organizer: Organizer, payload: list[dict]
) -> Organizer:
    """Replace the experience list wholesale (the frontend sends the full list)."""
    await session.execute(
        Experience.__table__.delete().where(
            Experience.__table__.c.organizer_id == organizer.id
        )
    )
    for item in payload:
        session.add(
            Experience(
                organizer_id=organizer.id,
                organization=item["organization"],
                years=item.get("years", 0),
                months=item.get("months", 0),
            )
        )
    await session.commit()
    await session.refresh(organizer)
    return organizer


async def set_achievements(
    session: AsyncSession, organizer: Organizer, payload: list[str]
) -> Organizer:
    await session.execute(
        Achievement.__table__.delete().where(
            Achievement.__table__.c.organizer_id == organizer.id
        )
    )
    for text in payload:
        session.add(Achievement(organizer_id=organizer.id, text=text))
    await session.commit()
    await session.refresh(organizer)
    return organizer


async def list_organizers(
    session: AsyncSession, *, search: str | None, page: int, page_size: int
) -> tuple[list[Organizer], int]:
    base: list = []
    count_stmt = select(func.count(Organizer.id))
    stmt = select(Organizer).options(selectinload(Organizer.experiences))

    if search:
        clause = or_(
            func.lower(Organizer.username).like(f"%{search.lower()}%"),
            func.lower(Organizer.email).like(f"%{search.lower()}%"),
        )
        base.append(clause)
    if base:
        stmt = stmt.where(*base)
        count_stmt = count_stmt.where(*base)

    total = await session.scalar(count_stmt) or 0
    stmt = (
        stmt.order_by(Organizer.id.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list((await session.scalars(stmt)).all()), total


async def get_organizer_by_row(
    session: AsyncSession, organizer: Organizer
) -> Organizer:
    """Reload an organizer with its experience and achievement lists loaded.

    `lazy="selectin"` does not re-populate relationships already present in the
    session identity map, so the instance from the auth dependency may carry
    stale or empty collections. Querying explicitly is reliable. The session is
    passed in rather than recovered via object_session, which under async would
    hand back the sync session.
    """
    return await get_organizer(session, organizer.id)


async def get_organizer(session: AsyncSession, organizer_id: int) -> Organizer:
    organizer = await session.scalar(
        select(Organizer)
        .options(
            selectinload(Organizer.experiences),
            selectinload(Organizer.achievements),
        )
        .where(Organizer.id == organizer_id)
    )
    if organizer is None:
        raise NotFoundError("Organizer not found", code="organizer_not_found")
    return organizer


async def delete_organizer(session: AsyncSession, organizer: Organizer) -> None:
    """Remove an organizer and everything they own.

    Cascades are declared on the FKs, so events, registrations, tickets and
    notifications go with them.
    """
    await session.delete(organizer)
    await session.commit()