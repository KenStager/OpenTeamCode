# Task 2: API Response Handler (WITH STANDARDS)

import json
from typing import Any, Optional

import requests


class AppError(Exception):
    """Base class for application errors."""

    pass


class ApiError(AppError):
    """Base class for API-related errors."""

    pass


class NetworkError(ApiError):
    """Raised when a network error occurs."""

    pass


class TimeoutError(ApiError):
    """Raised when a request times out."""

    pass


class InvalidResponseError(ApiError):
    """Raised when the API returns invalid data."""

    pass


DEFAULT_TIMEOUT: int = 30


def fetch_data(
    url: str,
    headers: Optional[dict[str, str]] = None,
    timeout: int = DEFAULT_TIMEOUT,
) -> dict[str, Any]:
    """Fetch JSON data from an external API.

    Args:
        url: The URL to fetch data from.
        headers: Optional HTTP headers to include in the request.
        timeout: Request timeout in seconds.

    Returns:
        The parsed JSON response as a dictionary.

    Raises:
        TimeoutError: If the request times out.
        NetworkError: If a network error occurs.
        InvalidResponseError: If the response is not valid JSON.
    """
    try:
        response = requests.get(url, headers=headers, timeout=timeout)
        response.raise_for_status()
    except requests.exceptions.Timeout as e:
        raise TimeoutError(f"Request to {url} timed out after {timeout}s") from e
    except requests.exceptions.RequestException as e:
        raise NetworkError(f"Network error fetching {url}: {e}") from e

    try:
        return response.json()
    except json.JSONDecodeError as e:
        raise InvalidResponseError(f"Invalid JSON response from {url}") from e


def get_api_data(
    endpoint: str,
    api_key: Optional[str] = None,
) -> Optional[dict[str, Any]]:
    """Fetch data from an API endpoint with optional authentication.

    Args:
        endpoint: The API endpoint URL.
        api_key: Optional API key for authentication.

    Returns:
        The API response data, or None if the request fails.
    """
    headers: dict[str, str] = {}

    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    try:
        return fetch_data(endpoint, headers=headers)
    except ApiError:
        return None
