"""CLIP-based AI inference module.

Loads the OpenAI CLIP model once at import time and exposes functions
for image classification, embedding extraction, and combined analysis.

Reference: https://github.com/openai/CLIP
"""

from __future__ import annotations

import io

import os

import clip  # type: ignore
import pillow_heif  # type: ignore
import torch
from PIL import Image

# Constrain PyTorch thread memory footprint for low-RAM server environments
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
torch.set_num_threads(1)

# Register HEIC/HEIF support so Pillow can open iPhone photos
pillow_heif.register_heif_opener()

if torch.cuda.is_available():
    device = "cuda"
elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
    device = "mps"
else:
    device = "cpu"

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

_model = None
_preprocess = None
_text_features = None


def _get_model():
    """Lazily load the CLIP model and text prompts on first use to ensure instant server startup."""
    global _model, _preprocess, _text_features
    if _model is None:
        torch.set_num_threads(1)
        model_obj, prep_obj = clip.load("ViT-B/32", device=device)
        text_prompts = clip.tokenize([f"a photo of a {c}" for c in CATEGORIES]).to(device)
        with torch.inference_mode():
            t_feat = model_obj.encode_text(text_prompts)
            t_feat /= t_feat.norm(dim=-1, keepdim=True)
        _model = model_obj
        _preprocess = prep_obj
        _text_features = t_feat
    return _model, _preprocess, _text_features


def _prepare_image(image_bytes: bytes) -> tuple[torch.Tensor, any, any, any]:
    """Convert raw image bytes into a preprocessed tensor ready for CLIP."""
    model_obj, prep_obj, t_feat = _get_model()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image_input = prep_obj(image).unsqueeze(0).to(device)
    return image_input, model_obj, prep_obj, t_feat


def classify_image(image_bytes: bytes) -> tuple[str, list[dict]]:
    """Classify an image against the fixed category list."""
    image_input, model_obj, _, t_feat = _prepare_image(image_bytes)

    with torch.inference_mode():
        image_features = model_obj.encode_image(image_input)
        image_features /= image_features.norm(dim=-1, keepdim=True)

        similarity = (100.0 * image_features @ t_feat.T).softmax(dim=-1)
        values, indices = similarity[0].topk(3)

    predictions = [
        {"category": CATEGORIES[idx], "confidence": round(float(val), 4)}
        for val, idx in zip(values, indices)
    ]

    return predictions[0]["category"], predictions


def embed_image(image_bytes: bytes) -> list[float]:
    """Extract the CLIP embedding vector for an image."""
    image_input, model_obj, _, _ = _prepare_image(image_bytes)

    with torch.inference_mode():
        image_features = model_obj.encode_image(image_input)
        image_features /= image_features.norm(dim=-1, keepdim=True)

    return image_features[0].cpu().tolist()


def analyze_image(image_bytes: bytes) -> tuple[str, list[float]]:
    """Classify and embed an image in a single forward pass."""
    image_input, model_obj, _, t_feat = _prepare_image(image_bytes)

    with torch.inference_mode():
        image_features = model_obj.encode_image(image_input)
        image_features /= image_features.norm(dim=-1, keepdim=True)

        similarity = (100.0 * image_features @ t_feat.T).softmax(dim=-1)
        values, indices = similarity[0].topk(1)
        top_category = CATEGORIES[indices[0]]

    embedding = image_features[0].cpu().tolist()

    return top_category, embedding
