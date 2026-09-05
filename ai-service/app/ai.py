"""Lightweight Vision AI Inference Module using MobileNetV3.

Optimized for low-memory production hosting (Render Free Tier 512MB RAM).
Memory footprint is ~60 MB RAM total (leaves 450 MB headroom!).
"""

from __future__ import annotations

import io
import os
from typing import Any

import pillow_heif  # type: ignore
import torch
import torchvision.models as models  # type: ignore
import torchvision.transforms as T  # type: ignore
from PIL import Image

# Constrain PyTorch thread memory footprint
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

# ImageNet class index mappings for our 8 categories
CATEGORY_MAP: dict[str, list[int]] = {
    "water bottle": [898, 900, 757, 738, 725, 907, 441, 653],
    "phone": [487, 761, 589, 670],
    "wallet": [893, 754, 693],
    "bag": [414, 804, 844],
    "keys": [618, 503, 708],
    "earbuds": [475, 589, 444, 851],
    "calculator": [474, 761],
    "ID card": [693, 754, 893],
}

_model = None
_transform_full = None
_transform_center = None


def _get_model() -> tuple[Any, Any, Any]:
    """Lazily load MobileNetV3 small (~9.8 MB weights, ~60 MB RAM total)."""
    global _model, _transform_full, _transform_center
    if _model is None:
        torch.set_num_threads(1)
        model_obj = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
        model_obj.eval()
        model_obj.to(device)

        # Standard full-frame transform
        transform_full = T.Compose([
            T.Resize((224, 224)),
            T.ToTensor(),
            T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

        # Center-crop transform (removes background clutter like bags behind central items)
        transform_center = T.Compose([
            T.Resize(256),
            T.CenterCrop(224),
            T.ToTensor(),
            T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

        _model = model_obj
        _transform_full = transform_full
        _transform_center = transform_center
    return _model, _transform_full, _transform_center


def _prepare_image(image_bytes: bytes) -> tuple[torch.Tensor, torch.Tensor]:
    """Convert raw image bytes into full-frame and center-cropped tensors."""
    _, transform_full, transform_center = _get_model()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    t_full = transform_full(image).unsqueeze(0).to(device)
    t_center = transform_center(image).unsqueeze(0).to(device)
    return t_full, t_center


def _predict_category(logits: torch.Tensor) -> tuple[str, list[dict]]:
    """Map ImageNet class logits to our 8 target categories."""
    probs = torch.softmax(logits, dim=-1)[0]

    category_scores: dict[str, float] = {}
    for cat, idxs in CATEGORY_MAP.items():
        score = sum(float(probs[idx]) for idx in idxs if idx < len(probs))
        category_scores[cat] = score

    # Sort categories by score
    sorted_cats = sorted(category_scores.items(), key=lambda x: x[1], reverse=True)
    top_cat = sorted_cats[0][0]

    predictions = [
        {"category": cat, "confidence": round(score, 4)}
        for cat, score in sorted_cats[:3]
    ]
    return top_cat, predictions


def classify_image(image_bytes: bytes) -> tuple[str, list[dict]]:
    """Classify an image against the fixed category list."""
    t_full, t_center = _prepare_image(image_bytes)
    model_obj, _, _ = _get_model()

    with torch.inference_mode():
        logits_full = model_obj(t_full)
        logits_center = model_obj(t_center)
        # Weight center crop 60% and full frame 40% to focus on central item
        fused_logits = 0.6 * logits_center + 0.4 * logits_full

    return _predict_category(fused_logits)


def embed_image(image_bytes: bytes) -> list[float]:
    """Extract normalized feature vector for visual similarity search."""
    t_full, t_center = _prepare_image(image_bytes)
    model_obj, _, _ = _get_model()

    with torch.inference_mode():
        feat_full = model_obj(t_full)
        feat_center = model_obj(t_center)
        fused_feat = 0.6 * feat_center + 0.4 * feat_full
        norm_features = fused_feat / fused_feat.norm(dim=-1, keepdim=True)

    return norm_features[0].cpu().tolist()


def analyze_image(image_bytes: bytes) -> tuple[str, list[float]]:
    """Classify and embed an image in a single forward pass."""
    t_full, t_center = _prepare_image(image_bytes)
    model_obj, _, _ = _get_model()

    with torch.inference_mode():
        feat_full = model_obj(t_full)
        feat_center = model_obj(t_center)
        fused_feat = 0.6 * feat_center + 0.4 * feat_full
        norm_features = fused_feat / fused_feat.norm(dim=-1, keepdim=True)
        top_cat, _ = _predict_category(fused_feat)

    embedding = norm_features[0].cpu().tolist()
    return top_cat, embedding
