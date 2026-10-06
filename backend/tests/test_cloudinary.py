"""Cloudinary integration tests.

The upload path was silently broken: the SDK (1.46.3) exposes only blocking
`upload`/`destroy`, but the code called `upload_async`/`destroy_async`, which do
not exist. Every image upload would have raised AttributeError. The existing
suite never caught it because nothing exercised a real upload.

These tests mock the SDK so the shape of the call is asserted without network
access.
"""

from __future__ import annotations

import pytest

from app.core import cloudinary
from app.core.errors import APIError, BadRequestError


class _FakeUploader:
    """Records calls and returns a plausible SDK response."""

    def __init__(self) -> None:
        self.uploaded: list[tuple] = []
        self.destroyed: list[str] = []
        self.upload_error: Exception | None = None

    def upload(self, data, **kwargs):
        if self.upload_error:
            raise self.upload_error
        self.uploaded.append((data, kwargs))
        return {"secure_url": f"https://res.cloudinary.com/test/image/upload/{kwargs.get('folder')}/abc.png"}

    def destroy(self, public_id, **kwargs):
        self.destroyed.append(public_id)
        return {"result": "ok"}


@pytest.fixture
def fake(monkeypatch):
    uploader = _FakeUploader()
    monkeypatch.setattr(cloudinary.cloudinary, "uploader", uploader)
    monkeypatch.setattr(
        cloudinary.settings.__class__,
        "cloudinary_configured",
        property(lambda self: True),
    )
    return uploader


class TestUpload:
    async def test_upload_returns_secure_url(self, fake):
        url = await cloudinary.upload_image(b"png-bytes", kind="banner")
        assert url.endswith("abc.png")
        assert len(fake.uploaded) == 1

    async def test_upload_uses_the_kind_folder(self, fake):
        await cloudinary.upload_image(b"x", kind="profile")
        await cloudinary.upload_image(b"x", kind="cover")
        folders = [kwargs["folder"] for _, kwargs in fake.uploaded]
        assert folders == ["profile_images", "cover_images"]

    async def test_upload_rejects_empty_payload(self, fake):
        with pytest.raises(BadRequestError) as exc:
            await cloudinary.upload_image(b"", kind="banner")
        assert exc.value.code == "empty_upload"

    async def test_upload_failure_becomes_a_502(self, fake):
        fake.upload_error = RuntimeError("cloud is down")
        with pytest.raises(APIError) as exc:
            await cloudinary.upload_image(b"x", kind="banner")
        assert exc.value.status_code == 502

    async def test_sdk_has_no_async_upload(self):
        """Guards the specific regression.

        If a future SDK release adds *_async methods this stays true and the
        test below is what actually pins the behaviour, but asserting the
        attribute is absent documents why asyncio.to_thread is required.
        """
        assert not hasattr(cloudinary.cloudinary.uploader, "upload_async")


class TestPublicIdRecovery:
    def test_extracts_public_id_with_folder(self):
        url = "https://res.cloudinary.com/demo/image/upload/v1699/profile_images/abc123.png"
        assert cloudinary.public_id_from_url(url, "profile") == "profile_images/abc123"

    def test_does_not_double_prefix_folder(self):
        """The original code split the URL and re-prefixed a hardcoded folder,
        producing profile_images/profile_images/<name> so nothing was deleted."""
        url = "https://res.cloudinary.com/demo/image/upload/v1699/profile_images/abc123.png"
        result = cloudinary.public_id_from_url(url, "profile")
        assert result.count("profile_images") == 1

    def test_handles_version_segment(self):
        url = "https://res.cloudinary.com/demo/image/upload/v1234567890/cover_images/x.jpg"
        assert cloudinary.public_id_from_url(url, "cover") == "cover_images/x"

    def test_non_cloudinary_url_returns_none(self):
        assert cloudinary.public_id_from_url("https://example.com/a.png", "profile") is None
        assert cloudinary.public_id_from_url("", "profile") is None

    async def test_delete_uses_recovered_public_id(self, fake):
        url = "https://res.cloudinary.com/demo/image/upload/v1/profile_images/old.png"
        assert await cloudinary.delete_image(url, "profile") is True
        assert fake.destroyed == ["profile_images/old"]

    async def test_delete_never_raises(self, fake):
        def boom(*_a, **_k):
            raise RuntimeError("network down")

        fake.destroy = boom
        url = "https://res.cloudinary.com/demo/image/upload/v1/profile_images/old.png"
        # Best-effort: a failed delete must not fail the request.
        assert await cloudinary.delete_image(url, "profile") is False