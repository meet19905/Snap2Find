"""Tests for the stats and visit tracking endpoints."""


class TestStats:
    """Test GET /api/stats."""

    def test_stats_empty_db(self, client):
        """Stats should return zeros on a fresh database."""
        response = client.get("/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert data["totalFound"] == 0
        assert data["totalRecovered"] == 0
        assert data["stillMissing"] == 0
        assert data["totalVisitors"] == 0

    def test_stats_after_found_item(self, client, test_image_bytes):
        """Stats should update after reporting a found item."""
        # Report a found item
        client.post(
            "/api/report-found",
            data={"phone_number": "9876543210", "description": "Test", "location": "Library"},
            files={"image": ("test.png", test_image_bytes, "image/png")},
        )

        response = client.get("/api/stats")
        data = response.json()
        assert data["totalFound"] == 1
        # The item is 'unclaimed' which counts as 'stillMissing'
        assert data["stillMissing"] >= 1


class TestVisit:
    """Test POST /api/visit."""

    def test_record_visit(self, client):
        """Recording a visit should succeed."""
        response = client.post("/api/visit")
        assert response.status_code == 200
        assert response.json()["success"] is True

    def test_visitor_count_increments(self, client):
        """Visitor count should increment after a visit."""
        client.post("/api/visit")
        client.post("/api/visit")

        response = client.get("/api/stats")
        data = response.json()
        assert data["totalVisitors"] == 2
