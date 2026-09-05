"""Stats and visit tracking API endpoints.

Replicates GET /api/stats and POST /api/visit from the Node.js backend.
"""

from __future__ import annotations

# pyrefly: ignore [missing-import]
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

    # For recovered items, we need to match the merging logic used in GET /api/items
    # so that the StatsStrip count matches the number of items displayed in the gallery.
    cursor = await db.execute("SELECT * FROM items WHERE status = 'recovered'")
    recovered_rows = await cursor.fetchall()

    import json
    from app.utils import cosine_similarity
    from app.config import settings

    merged_recovered = []
    for row in recovered_rows:
        row_dict = dict(row)
        try:
            row_emb = json.loads(row_dict["embedding"])
        except (KeyError, ValueError, TypeError):
            row_emb = None
        
        merged = False
        for m_item in merged_recovered:
            if m_item["category"] == row_dict["category"]:
                m_emb = m_item.get("_raw_embedding")
                if row_emb and m_emb and cosine_similarity(row_emb, m_emb) >= settings.verify_similarity_threshold:
                    merged = True
                    break
        if not merged:
            row_dict["_raw_embedding"] = row_emb
            merged_recovered.append(row_dict)

    total_recovered = len(merged_recovered)

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


@router.post("/reset-data", response_model=SuccessResponse)
async def reset_data():
    """Erase all items, visit counts, and reset database to zero."""
    db = await get_db()
    await db.execute("DELETE FROM items;")
    await db.execute("DELETE FROM visits;")
    try:
        await db.execute("DELETE FROM sqlite_sequence;")
    except Exception:
        pass
    await db.commit()

    # Clear uploaded images
    from app.config import UPLOAD_DIR
    if UPLOAD_DIR.exists():
        for file_path in UPLOAD_DIR.glob("*"):
            if file_path.is_file() and not file_path.name.startswith("."):
                try:
                    file_path.unlink()
                except Exception:
                    pass

    return SuccessResponse(success=True)
