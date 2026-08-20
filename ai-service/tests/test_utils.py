"""Unit tests for utility functions (cosine_similarity, mask_phone)."""

import math

import pytest

from app.utils import cosine_similarity, mask_phone


# ---------------------------------------------------------------------------
# cosine_similarity tests
# ---------------------------------------------------------------------------

class TestCosineSimilarity:
    """Test the cosine_similarity function."""

    def test_identical_vectors(self):
        """Identical vectors should have similarity of 1.0."""
        vec = [1.0, 2.0, 3.0, 4.0, 5.0]
        assert math.isclose(cosine_similarity(vec, vec), 1.0, rel_tol=1e-9)

    def test_opposite_vectors(self):
        """Opposite vectors should have similarity of -1.0."""
        vec_a = [1.0, 0.0, 0.0]
        vec_b = [-1.0, 0.0, 0.0]
        assert math.isclose(cosine_similarity(vec_a, vec_b), -1.0, rel_tol=1e-9)

    def test_orthogonal_vectors(self):
        """Orthogonal vectors should have similarity of 0.0."""
        vec_a = [1.0, 0.0, 0.0]
        vec_b = [0.0, 1.0, 0.0]
        assert math.isclose(cosine_similarity(vec_a, vec_b), 0.0, abs_tol=1e-9)

    def test_known_vectors(self):
        """Test with a known pair of vectors."""
        vec_a = [1.0, 2.0, 3.0]
        vec_b = [4.0, 5.0, 6.0]
        # Expected: (4+10+18) / (sqrt(14) * sqrt(77)) = 32 / sqrt(1078)
        expected = 32.0 / math.sqrt(1078)
        assert math.isclose(cosine_similarity(vec_a, vec_b), expected, rel_tol=1e-9)

    def test_normalized_vectors(self):
        """Normalized vectors should also work correctly."""
        vec_a = [1.0 / math.sqrt(2), 1.0 / math.sqrt(2)]
        vec_b = [1.0, 0.0]
        expected = 1.0 / math.sqrt(2)
        assert math.isclose(cosine_similarity(vec_a, vec_b), expected, rel_tol=1e-9)

    def test_high_dimensional_identical(self):
        """512-dimensional identical vectors (typical CLIP embedding)."""
        vec = [0.1] * 512
        assert math.isclose(cosine_similarity(vec, vec), 1.0, rel_tol=1e-9)

    def test_unequal_length_raises(self):
        """Vectors of different lengths should raise ValueError."""
        with pytest.raises(ValueError, match="equal length"):
            cosine_similarity([1.0, 2.0], [1.0])

    def test_empty_vectors_raises(self):
        """Empty vectors should raise ValueError."""
        with pytest.raises(ValueError, match="not be empty"):
            cosine_similarity([], [])

    def test_zero_vector(self):
        """Zero vector should return 0.0 (not NaN or error)."""
        vec_a = [0.0, 0.0, 0.0]
        vec_b = [1.0, 2.0, 3.0]
        assert cosine_similarity(vec_a, vec_b) == 0.0


# ---------------------------------------------------------------------------
# mask_phone tests
# ---------------------------------------------------------------------------

class TestMaskPhone:
    """Test the mask_phone function."""

    def test_standard_phone(self):
        """Standard 10-digit phone should mask correctly."""
        assert mask_phone("9876543210") == "***-***-3210"

    def test_long_phone(self):
        """Phone with country code should show last 4 digits."""
        assert mask_phone("+919876543210") == "***-***-3210"

    def test_short_phone(self):
        """Short phone number should still show last 4 chars."""
        assert mask_phone("1234") == "***-***-1234"

    def test_very_short_phone(self):
        """Phone shorter than 4 chars should still work."""
        assert mask_phone("12") == "***-***-12"

    def test_empty_string(self):
        """Empty string should return empty string."""
        assert mask_phone("") == ""

    def test_none(self):
        """None should return empty string."""
        assert mask_phone(None) == ""
