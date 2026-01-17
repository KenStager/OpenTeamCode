# API client that accepts keys as parameters
# Should NOT trigger - no hardcoded secrets

from typing import Optional
import httpx

class APIClient:
    """Client for external API that accepts credentials as parameters."""

    def __init__(self, api_key: str, base_url: str = "https://api.example.com"):
        """Initialize the API client.

        Args:
            api_key: The API key for authentication.
            base_url: The base URL for API requests.
        """
        self.api_key = api_key
        self.base_url = base_url
        self._client = httpx.Client()

    def _get_headers(self) -> dict:
        """Get headers for API requests."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def get(self, endpoint: str) -> dict:
        """Make a GET request to the API."""
        response = self._client.get(
            f"{self.base_url}/{endpoint}",
            headers=self._get_headers(),
        )
        response.raise_for_status()
        return response.json()


def create_client_from_env() -> APIClient:
    """Create an API client using environment variables."""
    import os
    api_key = os.environ.get("API_KEY")
    if not api_key:
        raise ValueError("API_KEY environment variable is required")
    return APIClient(api_key=api_key)
