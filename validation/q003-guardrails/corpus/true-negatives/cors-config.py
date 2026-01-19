# CORS configuration - NOT secrets
ALLOWED_ORIGINS = [
    "https://example.com",
    "https://app.example.com",
    "http://localhost:3000",
]

ALLOWED_METHODS = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]

ALLOWED_HEADERS = [
    "Content-Type",
    "Authorization",
    "X-API-Key",
    "X-Request-ID",
]

MAX_AGE = 86400  # 24 hours

def get_cors_headers(origin: str) -> dict:
    if origin in ALLOWED_ORIGINS:
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": ", ".join(ALLOWED_METHODS),
            "Access-Control-Allow-Headers": ", ".join(ALLOWED_HEADERS),
        }
    return {}
