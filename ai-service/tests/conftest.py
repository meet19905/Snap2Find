"""Shared test fixtures for the Snap2Find backend test suite.

Provides:
- An isolated in-memory SQLite database per test
- A FastAPI TestClient with proper dependency overrides
- A minimal 1x1 PNG test image fixture

Reference: https://fastapi.tiangolo.com/tutorial/testing/
Reference: https://docs.pytest.org/en/stable/how-to/fixtures.html
"""

from __future__ import annotations

import asyncio
import struct
import zlib
from unittest.mock import patch

import pytest


# ---------------------------------------------------------------------------
# Mock AI functions — deterministic, no CLIP model needed
# ---------------------------------------------------------------------------

def _mock_analyze_image(image_bytes: bytes) -> tuple[str, list[float]]:
    """Return a deterministic mock result for analyze_image."""
    return "wallet", [0.1] * 512


def _mock_classify_image(image_bytes: bytes) -> tuple[str, list[dict]]:
    """Return a deterministic mock result for classify_image."""
    return "wallet", [
        {"category": "wallet", "confidence": 0.85},
        {"category": "phone", "confidence": 0.10},
        {"category": "keys", "confidence": 0.05},
    ]


def _mock_embed_image(image_bytes: bytes) -> list[float]:
    """Return a deterministic mock embedding for embed_image."""
    return [0.1] * 512


# ---------------------------------------------------------------------------
# Test Image Helper
# ---------------------------------------------------------------------------

def create_test_png() -> bytes:
    """Create a minimal valid 1x1 PNG image."""

    def _chunk(chunk_type: bytes, data: bytes) -> bytes:
        chunk_data = chunk_type + data
        crc = struct.pack(">I", zlib.crc32(chunk_data) & 0xFFFFFFFF)
        return struct.pack(">I", len(data)) + chunk_data + crc

    signature = b"\x89PNG\r\n\x1a\n"
    ihdr_data = struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)
    ihdr = _chunk(b"IHDR", ihdr_data)
    raw_data = b"\x00\xff\x00\x00"
    compressed = zlib.compress(raw_data)
    idat = _chunk(b"IDAT", compressed)
    iend = _chunk(b"IEND", b"")

    return signature + ihdr + idat + iend


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def test_image_bytes() -> bytes:
    """A minimal valid PNG image for upload tests."""
    return create_test_png()


@pytest.fixture()
def client(tmp_path, test_image_bytes):
    """Create a TestClient with an isolated in-memory database and mocked AI.

    Each test gets a completely fresh in-memory database and temp uploads directory.
    The CLIP model is mocked so tests run fast without GPU.
    """
    test_upload_dir = tmp_path / "uploads"
    test_upload_dir.mkdir()

    # Patch AI functions in the modules where they are imported
    with patch("app.routers.items.analyze_image", side_effect=_mock_analyze_image), \
         patch("app.routers.ai.classify_image", side_effect=_mock_classify_image), \
         patch("app.routers.ai.embed_image", side_effect=_mock_embed_image), \
         patch("app.routers.ai.analyze_image", side_effect=_mock_analyze_image), \
         patch("app.routers.items.UPLOAD_DIR", test_upload_dir):

        from app import database
        from app.main import app

        # Force init_db to use :memory: for this test
        original_init = database.init_db

        async def test_init_db(db_path: str | None = None):
            """Always use in-memory database for tests."""
            await original_init(db_path=":memory:")

        database.init_db = test_init_db

        from starlette.testclient import TestClient
        with TestClient(app) as c:
            yield c

        # Restore original init_db
        database.init_db = original_init
