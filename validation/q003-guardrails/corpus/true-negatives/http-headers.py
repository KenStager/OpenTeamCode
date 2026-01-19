# HTTP header constants - NOT secrets
CONTENT_TYPE_JSON = "application/json"
CONTENT_TYPE_FORM = "application/x-www-form-urlencoded"

# Header names (not values)
HEADER_AUTHORIZATION = "Authorization"
HEADER_CONTENT_TYPE = "Content-Type"
HEADER_API_KEY = "X-API-Key"
HEADER_REQUEST_ID = "X-Request-ID"

def get_default_headers() -> dict[str, str]:
    return {
        HEADER_CONTENT_TYPE: CONTENT_TYPE_JSON,
        "Accept": CONTENT_TYPE_JSON,
    }

# Example header template (placeholder, not actual value)
AUTH_HEADER_TEMPLATE = "Bearer {token}"
