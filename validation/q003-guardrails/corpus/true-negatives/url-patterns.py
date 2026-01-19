# URL patterns and routing - NOT secrets
from typing import Pattern
import re

URL_PATTERNS: dict[str, str] = {
    "user_profile": "/users/{user_id}",
    "transaction": "/transactions/{transaction_id}",
    "webhook": "/webhooks/{webhook_id}/callback",
}

# Regex patterns for validation
USER_ID_PATTERN: Pattern = re.compile(r"^usr_[a-zA-Z0-9]{16}$")
TOKEN_PATTERN: Pattern = re.compile(r"^tok_[a-zA-Z0-9]{24}$")

def validate_user_id(user_id: str) -> bool:
    return bool(USER_ID_PATTERN.match(user_id))
