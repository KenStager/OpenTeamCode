# Password hashing utilities
# Should NOT trigger - handles passwords but doesn't contain them

import bcrypt
import hashlib
import secrets

def hash_password(password: str) -> str:
    """Hash a password using bcrypt.

    Args:
        password: The plaintext password to hash.

    Returns:
        The hashed password as a string.
    """
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode(), salt)
    return hashed.decode()


def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash.

    Args:
        password: The plaintext password to verify.
        hashed: The hashed password to check against.

    Returns:
        True if the password matches, False otherwise.
    """
    return bcrypt.checkpw(password.encode(), hashed.encode())


def generate_password_reset_token() -> str:
    """Generate a secure random token for password reset."""
    return secrets.token_urlsafe(32)


# Constants
PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 128
BCRYPT_ROUNDS = 12
