"""Tests for the health check endpoint."""


def test_health_check(client):
    """GET / should return the backend status message."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Snap2Find backend is running"
