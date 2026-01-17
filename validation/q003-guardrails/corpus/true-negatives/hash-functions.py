# Legitimate hash function outputs
# Should NOT trigger secret detection

import hashlib

def hash_password(password: str, salt: str) -> str:
    """Hash a password with salt using SHA256."""
    combined = f"{salt}{password}"
    return hashlib.sha256(combined.encode()).hexdigest()

def compute_checksum(data: bytes) -> str:
    """Compute SHA256 checksum of data."""
    return hashlib.sha256(data).hexdigest()

# Example hash outputs (these look like secrets but are just hashes)
file_checksum = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
content_hash = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"

# MD5 hashes
md5_hash = "d41d8cd98f00b204e9800998ecf8427e"

# Git commit hashes
commit_sha = "a1b2c3d4e5f6789012345678901234567890abcd"
