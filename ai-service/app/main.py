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

from pathlib import Path

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
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

# GZip middleware for response compression (speeds up JSON responses & web pages)
app.add_middleware(GZipMiddleware, minimum_size=500)

# CORS middleware — allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_cache_control_headers(request: Request, call_next):
    """Add caching headers to static file requests for fast browser rendering."""
    response: Response = await call_next(request)
    path = request.url.path
    if path.startswith("/uploads/") or path.startswith("/assets/"):
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    return response


# Serve uploaded images as static files at /uploads
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Include routers
app.include_router(items_router.router)
app.include_router(stats_router.router)
app.include_router(ai_router.router)


from fastapi.responses import FileResponse

# Serve built frontend static assets and index.html if available
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/")
    async def serve_frontend():
        """Serve the React application UI at root /."""
        index_file = FRONTEND_DIST / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return HealthResponse(status="Snap2Find backend is running")
else:
    @app.get("/")
    async def serve_root_health():
        return HealthResponse(status="Snap2Find backend is running")


@app.get("/health", response_model=HealthResponse)
@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for API monitoring."""
    return HealthResponse(status="Snap2Find backend is running")



