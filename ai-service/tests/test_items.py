"""Tests for item-related endpoints: found, lost, browse, recover, verify-claim.

These tests verify that the Python backend matches the Node.js backend behavior
exactly, including response structure, filtering logic, and edge cases.
"""

import json


class TestReportFound:
    """Test POST /api/found."""

    def test_report_found_success(self, client, test_image_bytes):
        """Should classify image and return matches without auto-inserting into DB."""
        response = client.post(
            "/api/found",
            data={
                "phone_number": "9876543210",
                "description": "Black leather wallet",
                "location": "Library",
            },
            files={"image": ("wallet.png", test_image_bytes, "image/png")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["id"] == 0
        assert isinstance(data["category"], str)
        assert data["message"] == "Found item analyzed successfully!"

    def test_report_found_without_optional_fields(self, client, test_image_bytes):
        """Should work with only the required fields (image + phone)."""
        response = client.post(
            "/api/found",
            data={"phone_number": "1234567890"},
            files={"image": ("item.png", test_image_bytes, "image/png")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_report_found_missing_image(self, client):
        """Should fail if no image is provided."""
        response = client.post(
            "/api/found",
            data={"phone_number": "9876543210"},
        )
        assert response.status_code == 422  # FastAPI validation error


class TestSearchLost:
    """Test POST /api/lost."""

    def test_search_lost_with_matches(self, client, test_image_bytes):
        """Should return matches from found items."""
        # First, report a found item into gallery
        client.post(
            "/api/report-found",
            data={"phone_number": "9876543210", "description": "Found wallet"},
            files={"image": ("found.png", test_image_bytes, "image/png")},
        )

        # Search for it
        response = client.post(
            "/api/lost",
            data={"phone_number": "1111111111", "description": "My wallet"},
            files={"image": ("lost.png", test_image_bytes, "image/png")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert isinstance(data["searched_category"], str)
        assert isinstance(data["matches"], list)
        assert isinstance(data["saved_to_gallery"], bool)

    def test_search_lost_matches_have_masked_phone(self, client, test_image_bytes):
        """Matched items should have masked phone numbers."""
        # Report a found item
        client.post(
            "/api/report-found",
            data={"phone_number": "9876543210"},
            files={"image": ("found.png", test_image_bytes, "image/png")},
        )

        # Search
        response = client.post(
            "/api/lost",
            data={"phone_number": "1234567890"},
            files={"image": ("lost.png", test_image_bytes, "image/png")},
        )
        data = response.json()
        if data["matches"]:
            phone = data["matches"][0]["phone_number"]
            assert "***-***-" in phone

    def test_search_lost_empty_db(self, client, test_image_bytes):
        """Should return empty matches on a fresh database."""
        response = client.post(
            "/api/lost",
            data={"phone_number": "1234567890"},
            files={"image": ("lost.png", test_image_bytes, "image/png")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["matches"] == []
        assert data["saved_to_gallery"] is True  # Should save since no duplicates


class TestBrowseItems:
    """Test GET /api/items."""

    def test_browse_found_items(self, client, test_image_bytes):
        """Should list found items with default filters."""
        # Add a found item
        client.post(
            "/api/report-found",
            data={"phone_number": "9876543210"},
            files={"image": ("item.png", test_image_bytes, "image/png")},
        )

        response = client.get("/api/items", params={"type": "found", "status": "unclaimed"})
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["items"]) >= 1

    def test_browse_items_default_params(self, client, test_image_bytes):
        """Default GET /api/items should return unclaimed found items."""
        client.post(
            "/api/report-found",
            data={"phone_number": "9876543210"},
            files={"image": ("item.png", test_image_bytes, "image/png")},
        )

        response = client.get("/api/items")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_browse_items_by_category(self, client, test_image_bytes):
        """Should filter by category when provided."""
        # The mock AI always returns "wallet" as category
        client.post(
            "/api/report-found",
            data={"phone_number": "9876543210"},
            files={"image": ("item.png", test_image_bytes, "image/png")},
        )

        # Search for "wallet" category — should find the item
        response = client.get("/api/items", params={"category": "wallet"})
        data = response.json()
        assert data["success"] is True
        assert len(data["items"]) >= 1

        # Search for a different category — should find nothing
        response = client.get("/api/items", params={"category": "keys"})
        data = response.json()
        assert data["success"] is True
        assert len(data["items"]) == 0

    def test_browse_items_category_all(self, client, test_image_bytes):
        """Category 'all' should return all items."""
        client.post(
            "/api/report-found",
            data={"phone_number": "9876543210"},
            files={"image": ("item.png", test_image_bytes, "image/png")},
        )

        response = client.get("/api/items", params={"category": "all"})
        data = response.json()
        assert data["success"] is True
        assert len(data["items"]) >= 1

    def test_browse_recovered_items(self, client, test_image_bytes):
        """Should list recovered items regardless of type."""
        # Create and recover an item
        res = client.post(
            "/api/report-found",
            data={"phone_number": "9876543210"},
            files={"image": ("item.png", test_image_bytes, "image/png")},
        )
        item_id = res.json()["id"]

        client.post(
            f"/api/items/{item_id}/recover",
            data={"claimant_phone": "1234567890"},
        )

        response = client.get("/api/items", params={"status": "recovered"})
        data = response.json()
        assert data["success"] is True
        assert len(data["items"]) >= 1

    def test_browse_items_have_masked_phone(self, client, test_image_bytes):
        """Listed items should have masked phone numbers."""
        client.post(
            "/api/report-found",
            data={"phone_number": "9876543210"},
            files={"image": ("item.png", test_image_bytes, "image/png")},
        )

        response = client.get("/api/items")
        data = response.json()
        if data["items"]:
            phone = data["items"][0]["phone_number"]
            assert "***-***-" in phone


class TestRecoverItem:
    """Test POST /api/items/{id}/recover."""

    def test_recover_success(self, client, test_image_bytes):
        """Should mark item as recovered with claimant phone."""
        res = client.post(
            "/api/report-found",
            data={"phone_number": "9876543210"},
            files={"image": ("found.png", test_image_bytes, "image/png")},
        )
        item_id = res.json()["id"]

        response = client.post(
            f"/api/items/{item_id}/recover",
            data={"claimant_phone": "1234567890"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_recover_invalid_phone(self, client, test_image_bytes):
        """Should reject empty or short claimant phone number."""
        res = client.post(
            "/api/report-found",
            data={"phone_number": "9876543210"},
            files={"image": ("found.png", test_image_bytes, "image/png")},
        )
        item_id = res.json()["id"]

        response = client.post(
            f"/api/items/{item_id}/recover",
            data={"claimant_phone": "123"},
        )
        assert response.status_code == 400


class TestVerifyClaim:
    """Test POST /api/items/{id}/verify-claim."""

    def test_verify_claim_success(self, client, test_image_bytes):
        """Should verify and mark as recovered when similarity is high.

        The mock returns identical embeddings [0.1]*512 for all images,
        so cosine similarity = 1.0, which is > 0.65 threshold.
        """
        res = client.post(
            "/api/report-found",
            data={"phone_number": "9876543210"},
            files={"image": ("found.png", test_image_bytes, "image/png")},
        )
        item_id = res.json()["id"]

        response = client.post(
            f"/api/items/{item_id}/verify-claim",
            data={"claimant_phone": "1234567890"},
            files={"image": ("verify.png", test_image_bytes, "image/png")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["verified"] is True
        assert data["similarity"] > 0.65

    def test_verify_claim_invalid_phone(self, client, test_image_bytes):
        """Should reject invalid phone number."""
        res = client.post(
            "/api/report-found",
            data={"phone_number": "9876543210"},
            files={"image": ("found.png", test_image_bytes, "image/png")},
        )
        item_id = res.json()["id"]

        response = client.post(
            f"/api/items/{item_id}/verify-claim",
            data={"claimant_phone": "123"},
            files={"image": ("verify.png", test_image_bytes, "image/png")},
        )
        assert response.status_code == 400

    def test_verify_claim_missing_image(self, client, test_image_bytes):
        """Should fail if no verification image is uploaded."""
        res = client.post(
            "/api/report-found",
            data={"phone_number": "9876543210"},
            files={"image": ("found.png", test_image_bytes, "image/png")},
        )
        item_id = res.json()["id"]

        response = client.post(
            f"/api/items/{item_id}/verify-claim",
            data={"claimant_phone": "1234567890"},
        )
        assert response.status_code == 422

    def test_verify_claim_nonexistent_item(self, client, test_image_bytes):
        """Should return 404 for a non-existent item."""
        response = client.post(
            "/api/items/99999/verify-claim",
            data={"claimant_phone": "1234567890"},
            files={"image": ("verify.png", test_image_bytes, "image/png")},
        )
        assert response.status_code == 404

    def test_verify_claim_already_recovered(self, client, test_image_bytes):
        """Should reject claims on already-recovered items."""
        # Create and recover an item
        res = client.post(
            "/api/report-found",
            data={"phone_number": "9876543210"},
            files={"image": ("found.png", test_image_bytes, "image/png")},
        )
        item_id = res.json()["id"]

        client.post(
            f"/api/items/{item_id}/recover",
            data={"claimant_phone": "1234567890"},
        )

        # Try to verify-claim the same item
        response = client.post(
            f"/api/items/{item_id}/verify-claim",
            data={"claimant_phone": "9999999999"},
            files={"image": ("verify.png", test_image_bytes, "image/png")},
        )
        assert response.status_code == 400
