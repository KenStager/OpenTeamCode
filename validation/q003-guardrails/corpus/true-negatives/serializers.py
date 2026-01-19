# JSON serialization utilities - NOT secrets
import json
from datetime import datetime
from typing import Any

class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj: Any) -> Any:
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

def serialize(data: dict) -> str:
    return json.dumps(data, cls=DateTimeEncoder)

def deserialize(data: str) -> dict:
    return json.loads(data)

# Field mappings (not secrets)
FIELD_MAPPING = {
    "user_id": "userId",
    "created_at": "createdAt",
    "api_key": "apiKey",  # Just a field name, not a value
}
