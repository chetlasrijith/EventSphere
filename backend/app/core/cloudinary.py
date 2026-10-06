"""Cloudinary upload helpers."""

from __future__ import annotations

import re

import cloudinary
import cloudinary.uploader

from app.core.config import settings
from app.core.errors import BadRequestError, APIError

FOLDER_BY_KIND = {
    "profile": "profile_images",
    "cover": "cover_images",
    "banner": "banner_images",
}


def configure() -> None:
    """Idempotently apply credentials. Safe to call at import time."""
    if settings.cloudinary_configured:
        cloudinary.config(
            cloud_name=settings.cloudinary_cloud_name,
            api_key=settings.cloudinary_api_key,
            api_secret=settings.cloudinary_api_secret,
            secure=True,
        )


async def upload_image(data: bytes, kind: str) -> str:
    """Upload bytes and return the secure URL.

    Raises BadRequest when Cloudinary is unconfigured so the failure surfaces as
    a clear 400 rather than an opaque 500 from the SDK.
    """
    if not settings.cloudinary_configured:
        raise BadRequestError(
            "Image uploads are not configured; set the CLOUDINARY_* env vars",
            code="uploads_disabled",
        )
    if not data:
        raise BadRequestError("No image data received", code="empty_upload")

    folder = FOLDER_BY_KIND.get(kind, "misc")
    try:
        result = await cloudinary.uploader.upload_async(
            data, folder=folder, resource_type="image"
        )
    except Exception as exc:  # noqa: BLE001 - SDK raises many types
        raise APIError(502, f"Image upload failed: {exc}", code="upload_failed") from exc
    return result["secure_url"]


def public_id_from_url(url: str, kind: str) -> str | None:
    """Recover the Cloudinary public id so a replacement image can delete the old.

    The original code did `url.split("/").pop().split(".")[0]` and then prefixed
    a hardcoded folder, which produced `profile_images/profile_images/<name>`
    for already-prefixed URLs and never deleted anything.
    """
    if not url or "res.cloudinary.com" not in url:
        return None
    match = re.search(r"/upload/(?:v\d+/)?(.+)$", url)
    if not match:
        return None
    public_id = match.group(1)
    public_id = re.sub(r"\.[a-zA-Z0-9]+$", "", public_id)
    folder = FOLDER_BY_KIND.get(kind, "misc")
    # Already scoped to the folder -- use as-is rather than double-prefixing.
    if public_id.startswith(f"{folder}/"):
        return public_id
    return f"{folder}/{public_id}"


async def delete_image(url: str, kind: str) -> bool:
    """Best-effort delete. Returns False when nothing was removed."""
    public_id = public_id_from_url(url, kind)
    if not public_id or not settings.cloudinary_configured:
        return False
    try:
        result = await cloudinary.uploader.destroy_async(public_id)
    except Exception:  # noqa: BLE001 - deletion must never fail a request
        return False
    return result.get("result") == "ok"