"""Stats and visit tracking API endpoints.

Replicates GET /api/stats and POST /api/visit from the Node.js backend.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.database import get_db
from app.models import StatsResponse, SuccessResponse

router = APIRouter(prefix="/api", tags=["stats"])


@router.get("/stats", response_model=StatsResponse)
async def get_stats():
    """Return aggregate statistics matching the Node.js API contract."""
    db = await get_db()

    cursor = await db.execute("SELECT COUNT(*) as c FROM items WHERE type = 'found'")
    total_found = (await cursor.fetchone())["c"]

    cursor = await db.execute("SELECT COUNT(*) as c FROM items WHERE status = 'recovered'")
    total_recovered = (await cursor.fetchone())["c"]

    cursor = await db.execute("SELECT COUNT(*) as c FROM items WHERE status = 'unclaimed'")
    still_missing = (await cursor.fetchone())["c"]

    cursor = await db.execute("SELECT COUNT(*) as c FROM visits")
    total_visitors = (await cursor.fetchone())["c"]

    return StatsResponse(
        totalFound=total_found,
        totalRecovered=total_recovered,
        stillMissing=still_missing,
        totalVisitors=total_visitors,
    )


@router.post("/visit", response_model=SuccessResponse)
async def record_visit():
    """Record a page visit."""
    db = await get_db()
    await db.execute("INSERT INTO visits DEFAULT VALUES")
    await db.commit()
    return SuccessResponse(success=True)
