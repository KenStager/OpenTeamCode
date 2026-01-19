# Task 5: Cache Manager (WITHOUT STANDARDS)

import time

class CacheManager:
    """Simple in-memory cache with TTL support"""

    def __init__(self):
        self._cache = {}

    def set(self, key, value, ttl=300):
        """Store a value in cache with TTL (default 5 minutes)"""
        expiry = time.time() + ttl
        self._cache[key] = {"value": value, "expiry": expiry}

    def get(self, key):
        """Get a value from cache"""
        if key not in self._cache:
            return None

        entry = self._cache[key]
        if time.time() > entry["expiry"]:
            del self._cache[key]
            return None

        return entry["value"]

    def delete(self, key):
        """Delete a key from cache"""
        if key in self._cache:
            del self._cache[key]
            return True
        return False

    def clearExpired(self):
        """Remove all expired entries"""
        now = time.time()
        expiredKeys = [k for k, v in self._cache.items() if now > v["expiry"]]
        for key in expiredKeys:
            del self._cache[key]
        return len(expiredKeys)

    def clear(self):
        """Clear entire cache"""
        self._cache = {}
