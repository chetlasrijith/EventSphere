"""Shared schema primitives."""

from __future__ import annotations

from typing import Generic, TypeVar

from fastapi import Request
from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


def to_camel(name: str) -> str:
    """snake_case -> camelCase, used as the API's field alias generator."""
    parts = name.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


class APIModel(BaseModel):
    """Base for every request and response schema.

    The React frontend is written in camelCase throughout, so the wire format is
    camelCase while the Python attributes stay snake_case. Doing this in one
    place avoids translating field names in every component.

    `populate_by_name` means a client may send either camelCase or snake_case,
    so a partially-migrated client still works.
    """

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class ORMModel(APIModel):
    """Response schema populated straight from a SQLAlchemy model."""


class AddressBase(APIModel):
    street: str = Field(min_length=1, max_length=255)
    city: str = Field(min_length=1, max_length=120)
    state: str = Field(min_length=1, max_length=120)
    postal_code: str = Field(min_length=1, max_length=20)
    country: str = Field(min_length=1, max_length=120)


class AddressOut(AddressBase):
    pass


class Page(APIModel, Generic[T]):
    """Envelope for paginated collections.

    Extends APIModel rather than BaseModel so the wire fields are camelCase
    (`pageSize`, `totalPages`) like everything else.
    """

    items: list[T]
    page: int
    page_size: int
    total: int
    total_pages: int

    @classmethod
    def build(cls, items: list[T], *, page: int, page_size: int, total: int) -> "Page[T]":
        total_pages = (total + page_size - 1) // page_size if page_size else 0
        return cls(
            items=items,
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
        )


class Message(APIModel):
    detail: str


class PaginationParams(APIModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


def pagination_from_query(request: Request) -> PaginationParams:
    """Parse page/pageSize from the query string.

    FastAPI query parameters do not go through the model's camelCase alias
    generator, and `Query(validation_alias=AliasChoices(...))` only advertises
    the first name in the schema. Reading the raw params lets both spellings
    work regardless, which keeps a partially-migrated client functional.
    """
    raw_page = request.query_params.get("page", "1")
    raw_size = request.query_params.get("pageSize") or request.query_params.get(
        "page_size", "20"
    )
    return PaginationParams(page=raw_page, page_size=raw_size)