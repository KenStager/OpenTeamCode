# Audit log field definitions - NOT secrets
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Any

@dataclass
class AuditEntry:
    event_id: str
    timestamp: datetime
    actor_id: str
    action: str
    resource_type: str
    resource_id: str
    changes: Optional[dict] = None
    ip_address: Optional[str] = None

AUDIT_ACTIONS = [
    "create",
    "read",
    "update",
    "delete",
    "login",
    "logout",
    "password_change",
    "permission_change",
]

SENSITIVE_FIELDS = [
    "password",
    "password_hash",
    "api_key",
    "secret",
    "token",
]

def mask_sensitive_data(data: dict) -> dict:
    return {k: "***" if k in SENSITIVE_FIELDS else v for k, v in data.items()}
