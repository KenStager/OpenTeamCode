# Event type definitions - NOT secrets
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict

@dataclass
class Event:
    event_type: str
    timestamp: datetime
    payload: Dict[str, Any]

EVENT_USER_CREATED = "user.created"
EVENT_USER_UPDATED = "user.updated"
EVENT_USER_DELETED = "user.deleted"
EVENT_ORDER_PLACED = "order.placed"
EVENT_PAYMENT_COMPLETED = "payment.completed"

def create_event(event_type: str, payload: Dict[str, Any]) -> Event:
    return Event(
        event_type=event_type,
        timestamp=datetime.utcnow(),
        payload=payload,
    )
