"""Shared utility functions.

Pure functions with no side effects — easy to unit test.
"""

from __future__ import annotations

import math


def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """Compute cosine similarity between two vectors.

    Replicates the exact logic from the Node.js backend:

        let dot = 0, normA = 0, normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dot  += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));

    Args:
        vec_a: First embedding vector.
        vec_b: Second embedding vector.

    Returns:
        A float between -1.0 and 1.0.

    Raises:
        ValueError: If vectors have different lengths or are zero-length.
    """
    if len(vec_a) != len(vec_b):
        raise ValueError(
            f"Vectors must have equal length, got {len(vec_a)} and {len(vec_b)}"
        )
    if len(vec_a) == 0:
        raise ValueError("Vectors must not be empty")

    dot = 0.0
    norm_a = 0.0
    norm_b = 0.0
    for a, b in zip(vec_a, vec_b):
        dot += a * b
        norm_a += a * a
        norm_b += b * b

    denominator = math.sqrt(norm_a) * math.sqrt(norm_b)
    if denominator == 0.0:
        return 0.0

    return dot / denominator


def mask_phone(phone: str | None) -> str:
    """Mask a phone number, showing only the last 4 digits.

    Replicates the Node.js logic:
        item.phone_number ? `***-***-${item.phone_number.slice(-4)}` : ''

    Args:
        phone: The raw phone number string.

    Returns:
        A masked string like '***-***-3210', or '' if phone is falsy.
    """
    if not phone:
        return ""
    return f"***-***-{phone[-4:]}"


def process_and_save_image(contents: bytes, filename: str, upload_dir: any) -> tuple[str, str]:
    """Process an uploaded raw image file into optimized WebP images.

    1. Reads raw HEIC/JPEG/PNG/BMP image bytes into RGB PIL Image.
    2. Saves an optimized WebP display image (max 1200px, quality 82).
    3. Saves a fast WebP thumbnail (max 400px, quality 75).

    Args:
        contents: Raw bytes of the uploaded image file.
        filename: Original filename of the upload.
        upload_dir: Path object pointing to target uploads directory.

    Returns:
        A tuple of (image_path, thumb_path) relative strings (e.g. 'uploads/...').
    """
    import io
    import time
    from pathlib import Path
    from PIL import Image
    import pillow_heif

    pillow_heif.register_heif_opener()

    timestamp = int(time.time() * 1000)
    base_name = Path(filename).stem or "image"
    safe_name = "".join(c for c in base_name if c.isalnum() or c in ("-", "_")).rstrip()
    if not safe_name:
        safe_name = "upload"

    unique_stem = f"{timestamp}-{safe_name}"
    image_rel = f"uploads/{unique_stem}.webp"
    thumb_rel = f"uploads/thumb_{unique_stem}.webp"

    full_image_path = Path(upload_dir) / f"{unique_stem}.webp"
    full_thumb_path = Path(upload_dir) / f"thumb_{unique_stem}.webp"

    img = Image.open(io.BytesIO(contents)).convert("RGB")

    # Save optimized display image (max 1200x1200)
    disp_img = img.copy()
    disp_img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
    disp_img.save(full_image_path, "WEBP", quality=82, optimize=True)

    # Save thumbnail (max 400x400)
    thumb_img = img.copy()
    thumb_img.thumbnail((400, 400), Image.Resampling.LANCZOS)
    thumb_img.save(full_thumb_path, "WEBP", quality=75, optimize=True)

    return image_rel, thumb_rel

