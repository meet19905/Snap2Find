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
