"""Snap2Find Unified Backend — FastAPI Application.

Combines the Node.js Express backend and Python AI service into a single
FastAPI application that handles all API endpoints, file uploads, static
file serving, and CLIP-based AI inference.

Usage:
    uvicorn app.main:app --port 5050 --reload

Reference: https://fastapi.tiangolo.com/
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import UPLOAD_DIR
from app import database
from app.models import HealthResponse
from app.routers import ai as ai_router
from app.routers import items as items_router
from app.routers import stats as stats_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown.

    Uses module-level references (database.init_db, database.close_db) so
    that test fixtures can monkey-patch these functions for test isolation.

    Reference: https://fastapi.tiangolo.com/advanced/events/#lifespan
    """
    # Startup: initialize database
    await database.init_db()
    yield
    # Shutdown: close database connection
    await database.close_db()


app = FastAPI(
    title="Snap2Find Backend",
    description="Unified backend for the Snap2Find lost & found platform.",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS middleware — allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images as static files at /uploads
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Include routers
app.include_router(items_router.router)
app.include_router(stats_router.router)
app.include_router(ai_router.router)


@app.get("/", response_model=HealthResponse)
async def health_check():
    """Health check endpoint matching the Node.js backend response."""
    return HealthResponse(status="Snap2Find backend is running")
