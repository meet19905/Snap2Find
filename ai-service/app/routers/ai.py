"""Preserved AI-only endpoints from the original AI service.

These endpoints are kept for direct AI model access:
- POST /classify — image classification
- POST /embed — embedding extraction
- POST /analyze — combined classification + embedding
"""

from __future__ import annotations

from fastapi import APIRouter, File, UploadFile

from app.ai import analyze_image, classify_image, embed_image
from app.models import AnalyzeResponse, ClassifyResponse, EmbedResponse

router = APIRouter(tags=["ai"])


@router.post("/classify", response_model=ClassifyResponse)
async def classify(file: UploadFile = File(...)):
    """Takes an image, returns the best-matching category + confidence."""
    image_bytes = await file.read()
    top_category, predictions = classify_image(image_bytes)
    return ClassifyResponse(top_category=top_category, predictions=predictions)


@router.post("/embed", response_model=EmbedResponse)
async def embed(file: UploadFile = File(...)):
    """Takes an image, returns its embedding vector."""
    image_bytes = await file.read()
    embedding = embed_image(image_bytes)
    return EmbedResponse(embedding=embedding, dimensions=len(embedding))


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(file: UploadFile = File(...)):
    """Takes an image, returns both embedding and classification."""
    image_bytes = await file.read()
    top_category, embedding = analyze_image(image_bytes)
    return AnalyzeResponse(
        top_category=top_category,
        embedding=embedding,
        dimensions=len(embedding),
    )
