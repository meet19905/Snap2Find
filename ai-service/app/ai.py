"""CLIP-based AI inference module.

Loads the OpenAI CLIP model once at import time and exposes functions
for image classification, embedding extraction, and combined analysis.

Reference: https://github.com/openai/CLIP
"""

from __future__ import annotations

import io

import clip  # type: ignore
import pillow_heif  # type: ignore
import torch
from PIL import Image

# Register HEIC/HEIF support so Pillow can open iPhone photos
pillow_heif.register_heif_opener()

# ---------------------------------------------------------------------------
# Model & Device Setup (runs once at module import / server start)
# ---------------------------------------------------------------------------

if torch.cuda.is_available():
    device = "cuda"
elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
    device = "mps"
else:
    device = "cpu"

model, preprocess = clip.load("ViT-B/32", device=device)

# Fixed list of categories (matches the original AI service)
CATEGORIES: list[str] = [
    "calculator",
    "ID card",
    "wallet",
    "earbuds",
    "keys",
    "water bottle",
    "phone",
    "bag",
]

# Pre-encode category text prompts once for faster inference
text_prompts = clip.tokenize([f"a photo of a {c}" for c in CATEGORIES]).to(device)
with torch.no_grad():
    text_features = model.encode_text(text_prompts)
    text_features /= text_features.norm(dim=-1, keepdim=True)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def _prepare_image(image_bytes: bytes) -> torch.Tensor:
    """Convert raw image bytes into a preprocessed tensor ready for CLIP."""
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    return preprocess(image).unsqueeze(0).to(device)


def classify_image(image_bytes: bytes) -> tuple[str, list[dict]]:
    """Classify an image against the fixed category list.

    Returns:
        A tuple of (top_category, predictions) where predictions is
        a list of dicts with 'category' and 'confidence' keys.
    """
    image_input = _prepare_image(image_bytes)

    with torch.no_grad():
        image_features = model.encode_image(image_input)
        image_features /= image_features.norm(dim=-1, keepdim=True)

        similarity = (100.0 * image_features @ text_features.T).softmax(dim=-1)
        values, indices = similarity[0].topk(3)

    predictions = [
        {"category": CATEGORIES[idx], "confidence": round(float(val), 4)}
        for val, idx in zip(values, indices)
    ]

    return predictions[0]["category"], predictions


def embed_image(image_bytes: bytes) -> list[float]:
    """Extract the CLIP embedding vector for an image.

    Returns:
        A list of floats (512 dimensions for ViT-B/32).
    """
    image_input = _prepare_image(image_bytes)

    with torch.no_grad():
        image_features = model.encode_image(image_input)
        image_features /= image_features.norm(dim=-1, keepdim=True)

    return image_features[0].cpu().tolist()


def analyze_image(image_bytes: bytes) -> tuple[str, list[float]]:
    """Classify and embed an image in a single forward pass.

    Returns:
        A tuple of (top_category, embedding).
    """
    image_input = _prepare_image(image_bytes)

    with torch.no_grad():
        image_features = model.encode_image(image_input)
        image_features /= image_features.norm(dim=-1, keepdim=True)

        # Classification
        similarity = (100.0 * image_features @ text_features.T).softmax(dim=-1)
        values, indices = similarity[0].topk(1)
        top_category = CATEGORIES[indices[0]]

    embedding = image_features[0].cpu().tolist()

    return top_category, embedding
