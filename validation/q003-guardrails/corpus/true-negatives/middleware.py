# HTTP middleware - NOT secrets
from typing import Callable, Any

def authentication_middleware(handler: Callable) -> Callable:
    """Middleware to check authentication header."""
    def wrapper(request: Any) -> Any:
        # Check for Authorization header (not the actual value)
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return {"error": "Missing authorization header"}
        return handler(request)
    return wrapper

def rate_limit_middleware(max_requests: int = 100) -> Callable:
    """Middleware for rate limiting."""
    def decorator(handler: Callable) -> Callable:
        def wrapper(request: Any) -> Any:
            # Rate limiting logic here
            return handler(request)
        return wrapper
    return decorator
