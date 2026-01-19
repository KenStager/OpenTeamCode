# Task 5: Cache Manager (WITH STANDARDS)

import time
from dataclasses import dataclass
from typing import Any, Optional

DEFAULT_TTL: int = 300  # 5 minutes


@dataclass
class CacheEntry:
    """Represents a cached value with expiration time."""

    value: Any
    expiry: float


class CacheManager:
    """In-memory cache with time-to-live support.

    Provides get, set, and delete operations with automatic
    expiration of entries based on TTL.

    Attributes:
        _cache: Internal dictionary storing cache entries.
    """

    def __init__(self) -> None:
        """Initialize an empty cache."""
        self._cache: dict[str, CacheEntry] = {}

    def set(self, key: str, value: Any, ttl: int = DEFAULT_TTL) -> None:
        """Store a value in the cache with a time-to-live.

        Args:
            key: The cache key.
            value: The value to store.
            ttl: Time-to-live in seconds. Defaults to 300 (5 minutes).
        """
        expiry = time.time() + ttl
        self._cache[key] = CacheEntry(value=value, expiry=expiry)

    def get(self, key: str) -> Optional[Any]:
        """Retrieve a value from the cache.

        Args:
            key: The cache key to look up.

        Returns:
            The cached value if found and not expired, None otherwise.
        """
        if key not in self._cache:
            return None

        entry = self._cache[key]

        if time.time() > entry.expiry:
            del self._cache[key]
            return None

        return entry.value

    def delete(self, key: str) -> bool:
        """Delete a key from the cache.

        Args:
            key: The cache key to delete.

        Returns:
            True if the key was deleted, False if it didn't exist.
        """
        if key in self._cache:
            del self._cache[key]
            return True

        return False

    def clear_expired(self) -> int:
        """Remove all expired entries from the cache.

        Returns:
            The number of entries that were removed.
        """
        now = time.time()
        expired_keys = [
            key for key, entry in self._cache.items() if now > entry.expiry
        ]

        for key in expired_keys:
            del self._cache[key]

        return len(expired_keys)

    def clear(self) -> None:
        """Remove all entries from the cache."""
        self._cache.clear()

    def size(self) -> int:
        """Return the number of entries in the cache.

        Returns:
            The current cache size.
        """
        return len(self._cache)
