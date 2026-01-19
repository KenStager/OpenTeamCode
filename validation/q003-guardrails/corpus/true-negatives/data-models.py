# Data models with ID fields - NOT secrets
from dataclasses import dataclass
from datetime import datetime

@dataclass
class User:
    user_id: str  # e.g., "usr_abc123def456"
    email: str
    created_at: datetime

@dataclass
class Transaction:
    transaction_id: str  # e.g., "txn_1234567890abcdef"
    amount: float
    currency: str

@dataclass
class Session:
    session_id: str  # e.g., "sess_abcdefghijklmnop"
    user_id: str
    expires_at: datetime
