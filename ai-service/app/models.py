"""Pydantic v2 models for all API request and response types.

Uses Pydantic v2 best practices:
- Field constraints via Annotated types where possible (Rust-native, faster)
- @field_validator for custom single-field logic
- @model_validator for cross-field logic
- model_config for JSON serialization settings

Reference: https://docs.pydantic.dev/latest/
"""

from __future__ import annotations

from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Request Models
# ---------------------------------------------------------------------------

class RecoverRequest(BaseModel):
    """Body for POST /api/items/{id}/recover."""

    claimant_phone: Annotated[str, Field(min_length=10)]

    @field_validator("claimant_phone", mode="after")
    @classmethod
    def strip_phone(cls, v: str) -> str:
        return v.strip()


# ---------------------------------------------------------------------------
# Response Models
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    """GET / response."""

    status: str


class FoundItemResponse(BaseModel):
    """POST /api/found response."""

    success: bool
    id: int
    category: str
    message: str
    matches: list[ItemMatch] | None = None


class ItemMatch(BaseModel):
    """A single item in a search result or browse list."""

    id: int
    type: str
    category: str | None = None
    location: str | None = None
    image_path: str | None = None
    thumb_path: str | None = None
    matched_image_path: str | None = None
    phone_number: str | None = None
    description: str | None = None
    status: str | None = None
    similarity: float | None = None
    created_at: str | None = None
    claimed_by_phone: str | None = None


class LostSearchResponse(BaseModel):
    """POST /api/lost response."""

    success: bool
    searched_category: str
    matches: list[ItemMatch]
    saved_to_gallery: bool


class ItemListResponse(BaseModel):
    """GET /api/items response."""

    success: bool
    items: list[ItemMatch]


class StatsResponse(BaseModel):
    """GET /api/stats response.

    Field names use camelCase to match the original Node.js API contract,
    which the frontend expects.
    """

    totalFound: int
    totalRecovered: int
    stillMissing: int
    totalVisitors: int


class SuccessResponse(BaseModel):
    """Generic success response."""

    success: bool


class VerifyClaimResponse(BaseModel):
    """POST /api/items/{id}/verify-claim response."""

    success: bool
    similarity: float | None = None
    verified: bool | None = None
    error: str | None = None


class ErrorResponse(BaseModel):
    """Generic error response."""

    success: bool = False
    error: str


# ---------------------------------------------------------------------------
# AI-specific Response Models (preserved from original AI service)
# ---------------------------------------------------------------------------

class ClassifyPrediction(BaseModel):
    """A single classification prediction."""

    category: str
    confidence: float


class ClassifyResponse(BaseModel):
    """POST /classify response."""

    top_category: str
    predictions: list[ClassifyPrediction]


class EmbedResponse(BaseModel):
    """POST /embed response."""

    embedding: list[float]
    dimensions: int


class AnalyzeResponse(BaseModel):
    """POST /analyze response."""

    top_category: str
    embedding: list[float]
    dimensions: int
