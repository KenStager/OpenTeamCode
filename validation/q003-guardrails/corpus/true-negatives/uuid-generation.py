# Legitimate UUID generation and handling
# Should NOT trigger secret detection

import uuid

def generate_user_id() -> str:
    """Generate a unique user identifier."""
    return str(uuid.uuid4())

def generate_session_id() -> str:
    """Generate a unique session identifier."""
    return str(uuid.uuid4())

# Example UUIDs (these look like keys but are just identifiers)
user_id = "550e8400-e29b-41d4-a716-446655440000"
session_id = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
transaction_id = "f47ac10b-58cc-4372-a567-0e02b2c3d479"

# UUID without dashes
compact_id = "550e8400e29b41d4a716446655440000"
