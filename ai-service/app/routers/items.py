"""Item-related API endpoints.

Handles found item reporting, lost item searching, browsing,
item recovery, and AI-verified claiming.

All endpoints replicate the exact API contract of the Node.js backend
so the React frontend works without modification.
"""

from __future__ import annotations

import json
import time

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.ai import analyze_image
from app.config import UPLOAD_DIR, settings
from app.database import get_db
from app.models import (
    ErrorResponse,
    FoundItemResponse,
    ItemListResponse,
    ItemMatch,
    LostSearchResponse,
    SuccessResponse,
    VerifyClaimResponse,
)
from app.utils import cosine_similarity, mask_phone, process_and_save_image

router = APIRouter(prefix="/api", tags=["items"])


async def _save_upload(file: UploadFile) -> tuple[str, str, bytes]:
    """Save an uploaded file as optimized WebP image & thumbnail.

    Returns:
        (image_path, thumb_path, raw_bytes)
    """
    contents = await file.read()
    image_path, thumb_path = process_and_save_image(contents, file.filename or "upload.jpg", UPLOAD_DIR)
    return image_path, thumb_path, contents


# --------------------------------------------------------------------------
# POST /api/found — Report a found item
# --------------------------------------------------------------------------

@router.post("/found", response_model=FoundItemResponse)
async def report_found(
    image: UploadFile = File(...),
    phone_number: str = Form(...),
    description: str = Form(""),
    location: str = Form(""),
):
    """Upload a photo of a found item. AI classifies it and checks for lost item matches without auto-saving to gallery."""
    if not phone_number or len(phone_number.strip()) < 10:
        raise HTTPException(
            status_code=400,
            detail="A valid phone number is required.",
        )

    image_path, thumb_path, image_bytes = await _save_upload(image)
    category, embedding = analyze_image(image_bytes)

    db = await get_db()
    
    # Search among lost items
    cursor = await db.execute("SELECT * FROM items WHERE type = 'lost' AND status = 'unclaimed'")
    lost_items = await cursor.fetchall()

    results: list[dict] = []
    for item in lost_items:
        item_embedding = json.loads(item["embedding"])
        sim = cosine_similarity(embedding, item_embedding)
        item_dict = dict(item)
        results.append({
            "id": item_dict["id"],
            "type": item_dict["type"],
            "category": item_dict["category"],
            "location": item_dict["location"],
            "image_path": item_dict["image_path"],
            "thumb_path": item_dict.get("thumb_path") or item_dict["image_path"],
            "phone_number": item_dict["phone_number"],
            "description": item_dict["description"],
            "similarity": sim,
        })

    # Sort by similarity descending and take top 5
    results.sort(key=lambda x: x["similarity"], reverse=True)
    top_matches = [m for m in results[:5] if m["similarity"] >= settings.verify_similarity_threshold]

    return FoundItemResponse(
        success=True,
        id=0,
        category=category,
        message="Found item analyzed successfully!",
        matches=[ItemMatch(**m) for m in top_matches],
    )

# --------------------------------------------------------------------------
# POST /api/report-found — Explicitly add a found item to the gallery
# --------------------------------------------------------------------------

@router.post("/report-found", response_model=FoundItemResponse)
async def explicit_report_found(
    image: UploadFile = File(...),
    phone_number: str = Form(...),
    description: str = Form(""),
    location: str = Form(""),
    category: str | None = Form(None),
):
    """Upload a photo of a found item to add to the gallery."""
    if not phone_number or len(phone_number.strip()) < 10:
        raise HTTPException(
            status_code=400,
            detail="A valid phone number is required.",
        )

    image_path, thumb_path, image_bytes = await _save_upload(image)
    ai_category, embedding = analyze_image(image_bytes)
    final_category = category.strip() if category and category.strip() else ai_category

    db = await get_db()
    cursor = await db.execute(
        """
        INSERT INTO items (type, category, location, image_path, thumb_path, embedding, phone_number, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        ("found", final_category, location, image_path, thumb_path, json.dumps(embedding), phone_number.strip(), description),
    )
    await db.commit()

    return FoundItemResponse(
        success=True,
        id=cursor.lastrowid,
        category=final_category,
        message="Found item added to gallery successfully!",
    )


# --------------------------------------------------------------------------
# POST /api/lost — Search for a lost item
# --------------------------------------------------------------------------

@router.post("/lost", response_model=LostSearchResponse)
async def search_lost(
    image: UploadFile = File(...),
    phone_number: str = Form(...),
    description: str = Form(""),
    location: str = Form(""),
):
    """Upload a photo of a lost item. AI searches visually among found items."""
    if not phone_number or len(phone_number.strip()) < 10:
        raise HTTPException(
            status_code=400,
            detail="A valid phone number is required.",
        )

    image_path, thumb_path, image_bytes = await _save_upload(image)
    category, embedding = analyze_image(image_bytes)

    db = await get_db()
    cursor = await db.execute("SELECT * FROM items WHERE type = 'found'")
    found_items = await cursor.fetchall()

    results: list[dict] = []
    for item in found_items:
        item_dict = dict(item)
        item_embedding = json.loads(item_dict["embedding"])
        sim = cosine_similarity(embedding, item_embedding)
        results.append({
            "id": item_dict["id"],
            "type": item_dict["type"],
            "category": item_dict["category"],
            "location": item_dict["location"],
            "image_path": item_dict["image_path"],
            "thumb_path": item_dict.get("thumb_path") or item_dict["image_path"],
            "phone_number": mask_phone(item_dict["phone_number"]),
            "description": item_dict["description"],
            "similarity": sim,
        })

    # Sort by similarity descending and take top 5
    results.sort(key=lambda x: x["similarity"], reverse=True)
    top_matches = results[:5]

    highest_similarity = top_matches[0]["similarity"] if top_matches else 0
    saved_to_gallery = True

    if top_matches and highest_similarity >= settings.lost_duplicate_threshold:
        # Max match found: auto-reunite the item
        best_match_id = top_matches[0]["id"]
        claim_phone = phone_number.strip() if phone_number else "Auto-matched via search"
        await db.execute(
            "UPDATE items SET status = 'recovered', claimed_by_phone = ? WHERE id = ?",
            (claim_phone, best_match_id),
        )
        await db.commit()
        # Ensure the frontend gets the updated status
        top_matches[0]["status"] = "recovered"
        saved_to_gallery = False

    return LostSearchResponse(
        success=True,
        searched_category=category,
        matches=[ItemMatch(**m) for m in top_matches],
        saved_to_gallery=saved_to_gallery,
    )


# --------------------------------------------------------------------------
# POST /api/report-lost — Explicitly add a lost item to the gallery
# --------------------------------------------------------------------------

@router.post("/report-lost", response_model=FoundItemResponse)
async def report_lost(
    image: UploadFile = File(...),
    phone_number: str = Form(...),
    description: str = Form(""),
    location: str = Form(""),
    category: str | None = Form(None),
):
    """Upload a photo of a lost item to add to the gallery."""
    if not phone_number or len(phone_number.strip()) < 10:
        raise HTTPException(
            status_code=400,
            detail="A valid phone number is required.",
        )

    image_path, thumb_path, image_bytes = await _save_upload(image)
    ai_category, embedding = analyze_image(image_bytes)
    final_category = category.strip() if category and category.strip() else ai_category

    db = await get_db()
    cursor = await db.execute(
        """
        INSERT INTO items (type, category, location, image_path, thumb_path, embedding, phone_number, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        ("lost", final_category, location, image_path, thumb_path, json.dumps(embedding), phone_number, description),
    )
    await db.commit()

    return FoundItemResponse(
        success=True,
        id=cursor.lastrowid,
        category=final_category,
        message="Lost item added to gallery successfully!",
    )


# --------------------------------------------------------------------------
# GET /api/items — Browse items with filtering
# --------------------------------------------------------------------------

@router.get("/items", response_model=ItemListResponse)
async def list_items(
    category: str | None = None,
    type: str = "found",
    status: str = "unclaimed",
):
    """List items filtered by type, status, and optional category."""
    db = await get_db()

    if status == "recovered":
        cursor = await db.execute(
            "SELECT * FROM items WHERE status = 'recovered' ORDER BY created_at DESC"
        )
    elif category and category != "all":
        if type == "all":
            cursor = await db.execute(
                """
                SELECT * FROM items WHERE status = ? AND category = ?
                ORDER BY created_at DESC
                """,
                (status, category),
            )
        else:
            cursor = await db.execute(
                """
                SELECT * FROM items WHERE type = ? AND status = ? AND category = ?
                ORDER BY created_at DESC
                """,
                (type, status, category),
            )
    else:
        if type == "all":
            cursor = await db.execute(
                """
                SELECT * FROM items WHERE status = ?
                ORDER BY created_at DESC
                """,
                (status,),
            )
        else:
            cursor = await db.execute(
                """
                SELECT * FROM items WHERE type = ? AND status = ?
                ORDER BY created_at DESC
                """,
                (type, status),
            )

    rows = await cursor.fetchall()

    items = []
    
    if status == "recovered":
        merged_items = []
        for row in rows:
            row_dict = dict(row)
            try:
                row_emb = json.loads(row_dict["embedding"])
            except (KeyError, ValueError, TypeError):
                row_emb = None
            
            merged = False
            for m_item in merged_items:
                if m_item["category"] == row_dict["category"]:
                    m_emb = m_item.get("_raw_embedding")
                    if row_emb and m_emb and cosine_similarity(row_emb, m_emb) >= settings.verify_similarity_threshold:
                        if not m_item.get("matched_image_path") and row_dict["image_path"] != m_item["image_path"]:
                            m_item["matched_image_path"] = row_dict["image_path"]
                        merged = True
                        break
            if not merged:
                row_dict["_raw_embedding"] = row_emb
                merged_items.append(row_dict)
        
        for item_dict in merged_items:
            item_dict.pop("embedding", None)
            item_dict.pop("_raw_embedding", None)
            if not item_dict.get("thumb_path"):
                item_dict["thumb_path"] = item_dict.get("image_path")
            item_dict["phone_number"] = mask_phone(item_dict.get("phone_number"))
            items.append(ItemMatch(**item_dict))
    else:
        for row in rows:
            item_dict = dict(row)
            # Remove 'embedding' from the response — it's internal data
            item_dict.pop("embedding", None)
            if not item_dict.get("thumb_path"):
                item_dict["thumb_path"] = item_dict.get("image_path")
            item_dict["phone_number"] = mask_phone(item_dict.get("phone_number"))
            items.append(ItemMatch(**item_dict))

    return ItemListResponse(success=True, items=items)


# --------------------------------------------------------------------------
# POST /api/items/{id}/recover — Simple recovery (deprecated, kept for compat)
# --------------------------------------------------------------------------

@router.post("/items/{item_id}/recover", response_model=SuccessResponse)
async def recover_item(item_id: int, claimant_phone: str = Form(...)):
    """Mark an item as recovered with a phone number."""
    if not claimant_phone or len(claimant_phone.strip()) < 10:
        raise HTTPException(
            status_code=400,
            detail="A valid phone number is required to confirm this claim.",
        )

    db = await get_db()
    await db.execute(
        "UPDATE items SET status = 'recovered', claimed_by_phone = ? WHERE id = ?",
        (claimant_phone.strip(), item_id),
    )
    await db.commit()

    return SuccessResponse(success=True)


# --------------------------------------------------------------------------
# POST /api/items/{id}/verify-claim — AI-verified claiming
# --------------------------------------------------------------------------

@router.post("/items/{item_id}/verify-claim")
async def verify_claim(
    item_id: int,
    image: UploadFile = File(...),
    claimant_phone: str = Form(...),
):
    """Verify item ownership via AI image comparison."""
    if not claimant_phone or len(claimant_phone.strip()) < 10:
        raise HTTPException(
            status_code=400,
            detail="A valid phone number is required.",
        )

    db = await get_db()
    cursor = await db.execute("SELECT * FROM items WHERE id = ?", (item_id,))
    item = await cursor.fetchone()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found.")

    if item["status"] == "recovered":
        raise HTTPException(status_code=400, detail="Item is already recovered.")

    image_path, thumb_path, image_bytes = await _save_upload(image)
    _, embedding = analyze_image(image_bytes)

    original_embedding = json.loads(item["embedding"])
    sim = cosine_similarity(embedding, original_embedding)

    if sim > settings.verify_similarity_threshold:
        await db.execute(
            "UPDATE items SET status = 'recovered', claimed_by_phone = ? WHERE id = ?",
            (claimant_phone.strip(), item_id),
        )
        await db.commit()
        return VerifyClaimResponse(success=True, similarity=sim, verified=True)
    else:
        return VerifyClaimResponse(
            success=False,
            similarity=sim,
            verified=False,
            error=f"AI Verification Failed (Similarity: {int(sim * 100)}%). The photo does not match closely enough.",
        )
