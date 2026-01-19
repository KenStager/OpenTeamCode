# Cache key patterns - NOT secrets
CACHE_PREFIX = "myapp:"
CACHE_TTL_SHORT = 300  # 5 minutes
CACHE_TTL_LONG = 3600  # 1 hour

def user_cache_key(user_id: str) -> str:
    return f"{CACHE_PREFIX}user:{user_id}"

def session_cache_key(session_id: str) -> str:
    return f"{CACHE_PREFIX}session:{session_id}"

def api_response_cache_key(endpoint: str, params: str) -> str:
    import hashlib
    param_hash = hashlib.md5(params.encode()).hexdigest()
    return f"{CACHE_PREFIX}api:{endpoint}:{param_hash}"
