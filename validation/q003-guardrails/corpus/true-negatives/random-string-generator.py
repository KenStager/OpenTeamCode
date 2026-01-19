# Random string generation - NOT secrets
import secrets
import string

def generate_random_string(length: int = 32) -> str:
    """Generate a random alphanumeric string."""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def generate_token() -> str:
    """Generate a secure token."""
    return secrets.token_urlsafe(32)

# Example outputs (generated at runtime, not actual secrets)
# token = "aBcDeFgHiJkLmNoPqRsTuVwXyZ123456"
