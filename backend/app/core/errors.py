"""Consistent error handling.

The original API returned ad-hoc bodies keyed by whatever the author typed that
day -- `{error}`, `{notFound}`, `{provide}`, `{unauthorized}`, `{Unauthorized}`,
`{completed}`, `{sent}`. Clients could not branch on anything except the status
code. Every error now returns `{"detail": ..., "code": ...}`.
"""

from __future__ import annotations

from fastapi import HTTPException, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

# Starlette renamed this constant; accept either spelling so the error handler
# keeps working across versions.
_UNPROCESSABLE = 422


class APIError(HTTPException):
    """HTTPException with a stable machine-readable code."""

    def __init__(
        self,
        status_code: int,
        detail: str,
        code: str = "error",
        headers: dict[str, str] | None = None,
    ) -> None:
        super().__init__(status_code=status_code, detail=detail, headers=headers)
        self.code = code


class NotFoundError(APIError):
    def __init__(self, detail: str = "Resource not found", code: str = "not_found") -> None:
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail, code=code)


class ConflictError(APIError):
    def __init__(self, detail: str, code: str = "conflict") -> None:
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail, code=code)


class BadRequestError(APIError):
    def __init__(self, detail: str, code: str = "bad_request") -> None:
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail, code=code)


class ForbiddenError(APIError):
    def __init__(self, detail: str = "You do not have access to this resource", code: str = "forbidden") -> None:
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail, code=code)


class UnauthorizedError(APIError):
    def __init__(self, detail: str = "Not authenticated", code: str = "unauthenticated") -> None:
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail, code=code)


async def api_error_handler(request: Request, exc: APIError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": exc.code},
        headers=exc.headers,
    )


async def http_error_handler(request: Request, exc: HTTPException) -> JSONResponse:
    code = exc.code if isinstance(exc, APIError) else "http_error"
    detail = exc.detail if isinstance(exc.detail, str) else "Request failed"
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": detail, "code": code},
        headers=getattr(exc, "headers", None),
    )


async def validation_error_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Flatten Pydantic's error list into `field -> message` pairs."""
    fields: dict[str, str] = {}
    for error in exc.errors():
        location = [str(part) for part in error["loc"] if part != "body"]
        fields[".".join(location) or "body"] = error["msg"]
    return JSONResponse(
        status_code=_UNPROCESSABLE,
        content={
            "detail": "Validation failed",
            "code": "validation_error",
            "fields": jsonable_encoder(fields),
        },
    )