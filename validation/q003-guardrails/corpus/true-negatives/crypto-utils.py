# Legitimate cryptography utilities
# Should NOT trigger secret detection

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

def generate_encryption_key() -> bytes:
    """Generate a new Fernet encryption key."""
    return Fernet.generate_key()

def derive_key_from_password(password: str, salt: bytes) -> bytes:
    """Derive an encryption key from a password."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    return kdf.derive(password.encode())

# Documentation example - not real keys
# The key format looks like: b'abc123...' (44 characters base64)
# Example: b'ZmRzYWZkc2FmZHNhZmRzYWZkc2FmZHNhZmRzYQ=='

# Algorithm constants (not secrets)
ALGORITHM = "AES-256-GCM"
KEY_LENGTH = 32
IV_LENGTH = 12
