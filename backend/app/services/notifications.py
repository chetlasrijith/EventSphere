"""Notification service.

Replaces three separate notification collections and three near-identical
list/detail handlers. The originals stored the sender as a Mixed field holding
either a string or an ObjectId, which is why every notification rendered with
the sender name "Unknown".
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError
from app.models.enums import NotificationSender
from app.models.notification import Notification, RecipientKind
from app.models.user import Admin, Attendee, Organizer


async def notify(
    session: AsyncSession,
    *,
    recipient_kind: RecipientKind,
    recipient_id: int,
    sender_kind: NotificationSender,
    sender_id: int | None,
    sender_name: str,
    subject: str,
    message: str,
) -> Notification:
    """Create one notification."""
    kwargs = {
        "subject": subject,
        "message": message,
        "recipient_kind": recipient_kind,
        "sender_kind": sender_kind,
        "sender_id": sender_id,
        "sender_name": sender_name,
    }
    if recipient_kind is RecipientKind.ORGANIZER:
        kwargs["organizer_recipient_id"] = recipient_id
    elif recipient_kind is RecipientKind.ATTENDEE:
        kwargs["attendee_recipient_id"] = recipient_id
    else:
        kwargs["admin_recipient_id"] = recipient_id

    notification = Notification(**kwargs)
    session.add(notification)
    return notification


def _recipient_column(recipient_kind: RecipientKind):
    return {
        RecipientKind.ORGANIZER: Notification.organizer_recipient_id,
        RecipientKind.ATTENDEE: Notification.attendee_recipient_id,
        RecipientKind.ADMIN: Notification.admin_recipient_id,
    }[recipient_kind]


async def list_notifications(
    session: AsyncSession,
    *,
    recipient_kind: RecipientKind,
    recipient_id: int,
    page: int,
    page_size: int,
    unread_only: bool = False,
) -> tuple[list[Notification], int]:
    column = _recipient_column(recipient_kind)
    base = [column == recipient_id]
    if unread_only:
        base.append(Notification.read_at.is_(None))
    count_stmt = select(func.count(Notification.id)).where(*base)
    stmt = (
        select(Notification)
        .where(*base)
        .order_by(Notification.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    total = await session.scalar(count_stmt) or 0
    items = list((await session.scalars(stmt)).all())
    return items, total


async def get_notification(
    session: AsyncSession,
    *,
    notification_id: int,
    recipient_kind: RecipientKind,
    recipient_id: int,
) -> Notification:
    """Fetch a notification, scoped to its owner.

    Scoping in the WHERE clause rather than checking afterwards is what stops
    one user reading another's messages by guessing an id.
    """
    column = _recipient_column(recipient_kind)
    notification = await session.scalar(
        select(Notification).where(Notification.id == notification_id, column == recipient_id)
    )
    if notification is None:
        raise NotFoundError("Notification not found", code="notification_not_found")
    return notification


async def mark_read(
    session: AsyncSession,
    *,
    notification_id: int,
    recipient_kind: RecipientKind,
    recipient_id: int,
) -> Notification:
    notification = await get_notification(
        session,
        notification_id=notification_id,
        recipient_kind=recipient_kind,
        recipient_id=recipient_id,
    )
    if notification.read_at is None:
        notification.read_at = datetime.now(timezone.utc)
        await session.commit()
        await session.refresh(notification)
    return notification


async def broadcast(
    session: AsyncSession,
    *,
    recipient_kind: RecipientKind,
    sender_kind: NotificationSender,
    sender_id: int | None,
    sender_name: str,
    subject: str,
    message: str,
) -> int:
    """Fan a message out to every holder of a role. Returns the recipient count.

    Builds one bulk INSERT rather than loading every user row into Python.
    """
    source = {
        RecipientKind.ATTENDEE: Attendee,
        RecipientKind.ORGANIZER: Organizer,
        RecipientKind.ADMIN: Admin,
    }[recipient_kind]

    ids = list((await session.scalars(select(source.id))).all())
    if not ids:
        return 0

    rows: list[dict] = []
    for target_id in ids:
        kwargs = {
            "subject": subject,
            "message": message,
            "recipient_kind": recipient_kind,
            "sender_kind": sender_kind,
            "sender_id": sender_id,
            "sender_name": sender_name,
        }
        if recipient_kind is RecipientKind.ORGANIZER:
            kwargs["organizer_recipient_id"] = target_id
        elif recipient_kind is RecipientKind.ATTENDEE:
            kwargs["attendee_recipient_id"] = target_id
        else:
            kwargs["admin_recipient_id"] = target_id
        rows.append(kwargs)

    session.add_all([Notification(**row) for row in rows])
    return len(rows)


async def delete_for_recipient(
    session: AsyncSession, *, recipient_kind: RecipientKind, recipient_id: int
) -> int:
    """Delete every notification addressed to a recipient. Returns the count."""
    column = _recipient_column(recipient_kind)
    result = await session.execute(
        Notification.__table__.delete().where(column == recipient_id)
    )
    await session.commit()
    return result.rowcount or 0


async def count_unread(
    session: AsyncSession, *, recipient_kind: RecipientKind, recipient_id: int
) -> int:
    column = _recipient_column(recipient_kind)
    return (
        await session.scalar(
            select(func.count(Notification.id)).where(
                column == recipient_id, Notification.read_at.is_(None)
            )
        )
    ) or 0