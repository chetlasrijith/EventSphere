"""Upload generated event posters to Cloudinary and attach them to events.

Usage:
    python -m tools.apply_posters --dir <poster-dir>
"""

from __future__ import annotations

import argparse
import asyncio
from pathlib import Path

import cloudinary
import cloudinary.uploader
from sqlalchemy import select

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.event import Event

cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret,
    secure=True,
)

# Poster filename stem -> event name in the database.
MAPPING = {
    "techfest-2026": "TechFest 2026",
    "startup-meetup": "Startup Meetup",
    "design-workshop": "Design Workshop (pending review)",
}


async def upload(path: Path) -> str:
    # The SDK is blocking-only; keep it off the event loop.
    result = await asyncio.to_thread(
        cloudinary.uploader.upload,
        str(path),
        folder="event_banners",
        resource_type="image",
        overwrite=True,
    )
    return result["secure_url"]


async def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dir", required=True)
    args = parser.parse_args()
    directory = Path(args.dir)

    async with SessionLocal() as session:
        for stem, event_name in MAPPING.items():
            path = directory / f"{stem}.png"
            if not path.exists():
                print(f"! missing {path}")
                continue

            event = await session.scalar(
                select(Event).where(Event.event_name == event_name)
            )
            if event is None:
                print(f"! no event named {event_name!r}")
                continue

            url = await upload(path)
            event.banner = url
            await session.commit()
            print(f"  {event_name} -> {url}")

    print("\nDone.")


if __name__ == "__main__":
    asyncio.run(main())