# Task 9: Rate Limiter (WITH STANDARDS)

import time
from collections import defaultdict
from dataclasses import dataclass

DEFAULT_MAX_REQUESTS: int = 100
DEFAULT_WINDOW_SECONDS: int = 60


@dataclass
class RateLimitStatus:
    """Status of a rate limit check.

    Attributes:
        allowed: Whether the request is allowed.
        remaining: Number of remaining requests in the window.
        reset_at: Unix timestamp when the window resets.
    """

    allowed: bool
    remaining: int
    reset_at: float


class RateLimiter:
    """Token bucket rate limiter for tracking request counts.

    Limits the number of requests a client can make within
    a configurable time window.

    Attributes:
        max_requests: Maximum requests allowed per window.
        window_seconds: Duration of the rate limit window.
    """

    def __init__(
        self,
        max_requests: int = DEFAULT_MAX_REQUESTS,
        window_seconds: int = DEFAULT_WINDOW_SECONDS,
    ) -> None:
        """Initialize the rate limiter.

        Args:
            max_requests: Maximum requests allowed per window.
            window_seconds: Duration of the rate limit window in seconds.
        """
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._clients: dict[str, list[float]] = defaultdict(list)

    def _cleanup_old_requests(self, client_id: str) -> None:
        """Remove expired timestamps for a client.

        Args:
            client_id: The client identifier to clean up.
        """
        now = time.time()
        cutoff = now - self.window_seconds
        self._clients[client_id] = [
            timestamp
            for timestamp in self._clients[client_id]
            if timestamp > cutoff
        ]

    def is_allowed(self, client_id: str) -> bool:
        """Check if a request from a client should be allowed.

        Args:
            client_id: The client making the request.

        Returns:
            True if the request is allowed, False if rate limited.
        """
        self._cleanup_old_requests(client_id)

        if len(self._clients[client_id]) >= self.max_requests:
            return False

        self._clients[client_id].append(time.time())
        return True

    def check(self, client_id: str) -> RateLimitStatus:
        """Check rate limit status for a client.

        Args:
            client_id: The client to check.

        Returns:
            A RateLimitStatus with allowed status and metadata.
        """
        self._cleanup_old_requests(client_id)
        current_count = len(self._clients[client_id])
        remaining = max(0, self.max_requests - current_count)

        if self._clients[client_id]:
            oldest = min(self._clients[client_id])
            reset_at = oldest + self.window_seconds
        else:
            reset_at = time.time() + self.window_seconds

        allowed = current_count < self.max_requests

        if allowed:
            self._clients[client_id].append(time.time())

        return RateLimitStatus(
            allowed=allowed,
            remaining=max(0, remaining - 1) if allowed else remaining,
            reset_at=reset_at,
        )

    def get_remaining_requests(self, client_id: str) -> int:
        """Get the number of remaining requests for a client.

        Args:
            client_id: The client identifier.

        Returns:
            The number of requests remaining in the current window.
        """
        self._cleanup_old_requests(client_id)
        return max(0, self.max_requests - len(self._clients[client_id]))

    def reset(self, client_id: str) -> None:
        """Reset the rate limit for a specific client.

        Args:
            client_id: The client identifier to reset.
        """
        if client_id in self._clients:
            del self._clients[client_id]

    def reset_all(self) -> None:
        """Reset rate limits for all clients."""
        self._clients.clear()
