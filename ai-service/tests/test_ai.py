"""Tests for the preserved AI-only endpoints (classify, embed, analyze).

These verify the original AI service functionality still works
in the unified backend.
"""


class TestClassify:
    """Test POST /classify."""

    def test_classify_returns_predictions(self, client, test_image_bytes):
        """Should return top_category and predictions list."""
        response = client.post(
            "/classify",
            files={"file": ("test.png", test_image_bytes, "image/png")},
        )
        assert response.status_code == 200
        data = response.json()
        assert "top_category" in data
        assert isinstance(data["top_category"], str)
        assert "predictions" in data
        assert isinstance(data["predictions"], list)
        assert len(data["predictions"]) > 0

    def test_classify_predictions_have_confidence(self, client, test_image_bytes):
        """Each prediction should have a category and confidence score."""
        response = client.post(
            "/classify",
            files={"file": ("test.png", test_image_bytes, "image/png")},
        )
        data = response.json()
        for pred in data["predictions"]:
            assert "category" in pred
            assert "confidence" in pred
            assert isinstance(pred["confidence"], float)


class TestEmbed:
    """Test POST /embed."""

    def test_embed_returns_vector(self, client, test_image_bytes):
        """Should return an embedding vector with correct dimensions."""
        response = client.post(
            "/embed",
            files={"file": ("test.png", test_image_bytes, "image/png")},
        )
        assert response.status_code == 200
        data = response.json()
        assert "embedding" in data
        assert isinstance(data["embedding"], list)
        assert "dimensions" in data
        assert data["dimensions"] == len(data["embedding"])
        # CLIP ViT-B/32 produces 512-dimensional embeddings
        assert data["dimensions"] == 512

    def test_embed_values_are_floats(self, client, test_image_bytes):
        """All embedding values should be floats."""
        response = client.post(
            "/embed",
            files={"file": ("test.png", test_image_bytes, "image/png")},
        )
        data = response.json()
        for val in data["embedding"]:
            assert isinstance(val, (int, float))


class TestAnalyze:
    """Test POST /analyze."""

    def test_analyze_returns_both(self, client, test_image_bytes):
        """Should return both top_category and embedding."""
        response = client.post(
            "/analyze",
            files={"file": ("test.png", test_image_bytes, "image/png")},
        )
        assert response.status_code == 200
        data = response.json()
        assert "top_category" in data
        assert isinstance(data["top_category"], str)
        assert "embedding" in data
        assert isinstance(data["embedding"], list)
        assert "dimensions" in data
        assert data["dimensions"] == len(data["embedding"])

    def test_analyze_missing_file(self, client):
        """Should return 422 if no file is uploaded."""
        response = client.post("/analyze")
        assert response.status_code == 422
