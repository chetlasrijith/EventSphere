"""Router registration."""

from fastapi import APIRouter

from app.api.routes import admins, attendees, auth, events, home, notifications, organizers

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(home.router)
api_router.include_router(events.router)
api_router.include_router(attendees.router)
api_router.include_router(organizers.router)
api_router.include_router(admins.router)

# Notification routes are split per role, so each prefix mounts separately.
api_router.include_router(notifications.attendee_router)
api_router.include_router(notifications.organizer_router)
api_router.include_router(notifications.admin_router)

__all__ = ["api_router"]