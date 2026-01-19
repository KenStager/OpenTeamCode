# Rate limiting configuration - NOT secrets
from dataclasses import dataclass

@dataclass
class RateLimitRule:
    requests_per_minute: int
    burst_size: int

RATE_LIMITS = {
    "default": RateLimitRule(requests_per_minute=60, burst_size=10),
    "authenticated": RateLimitRule(requests_per_minute=120, burst_size=20),
    "premium": RateLimitRule(requests_per_minute=600, burst_size=100),
}

ENDPOINT_LIMITS = {
    "/api/search": RateLimitRule(requests_per_minute=30, burst_size=5),
    "/api/upload": RateLimitRule(requests_per_minute=10, burst_size=2),
}

# Header names for rate limit info
HEADER_RATE_LIMIT = "X-RateLimit-Limit"
HEADER_RATE_REMAINING = "X-RateLimit-Remaining"
HEADER_RATE_RESET = "X-RateLimit-Reset"
