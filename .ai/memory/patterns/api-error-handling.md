# Pattern: API Error Handling

## Context
When building API endpoints or clients that handle errors from external services.

## Problem
Inconsistent error handling leads to:
- Poor user experience (generic error messages)
- Difficult debugging (lost error context)
- Security issues (exposing internal details)

## Solution

### For API Endpoints (Server-side)

```python
from typing import Optional
from dataclasses import dataclass

@dataclass
class APIError(Exception):
    """Base class for API errors."""
    message: str
    code: str
    status_code: int = 500
    details: Optional[dict] = None

    def to_response(self) -> dict:
        return {
            "error": {
                "code": self.code,
                "message": self.message,
                "details": self.details,
            }
        }


class NotFoundError(APIError):
    def __init__(self, resource: str, id: str):
        super().__init__(
            message=f"{resource} not found",
            code="NOT_FOUND",
            status_code=404,
            details={"resource": resource, "id": id},
        )


class ValidationError(APIError):
    def __init__(self, field: str, reason: str):
        super().__init__(
            message=f"Validation failed: {reason}",
            code="VALIDATION_ERROR",
            status_code=400,
            details={"field": field, "reason": reason},
        )
```

### For API Clients

```python
import httpx
from contextlib import contextmanager

@contextmanager
def handle_api_errors(service_name: str):
    """Context manager for consistent API error handling."""
    try:
        yield
    except httpx.HTTPStatusError as e:
        logger.error(f"{service_name} HTTP error: {e.response.status_code}")
        raise ServiceError(f"{service_name} request failed") from e
    except httpx.RequestError as e:
        logger.error(f"{service_name} connection error: {e}")
        raise ServiceUnavailableError(f"Cannot reach {service_name}") from e
```

## When to Use
- All public API endpoints
- All external service calls
- Any operation that can fail with meaningful context

## Related Patterns
- Circuit Breaker (for external services)
- Retry with Backoff
- Error Logging

## Team Decision
- Adopted: 2024-01-15
- Last Updated: 2024-01-15
