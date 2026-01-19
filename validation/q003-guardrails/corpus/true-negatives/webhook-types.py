# Webhook type definitions - NOT secrets
from dataclasses import dataclass
from typing import List, Optional
from enum import Enum

class WebhookEvent(Enum):
    USER_CREATED = "user.created"
    USER_UPDATED = "user.updated"
    ORDER_PLACED = "order.placed"
    PAYMENT_RECEIVED = "payment.received"

@dataclass
class WebhookEndpoint:
    endpoint_id: str
    url: str
    events: List[WebhookEvent]
    active: bool = True

@dataclass
class WebhookDelivery:
    delivery_id: str
    endpoint_id: str
    event: WebhookEvent
    status_code: int
    response_time_ms: int

# Webhook header names (not values)
WEBHOOK_SIGNATURE_HEADER = "X-Webhook-Signature"
WEBHOOK_TIMESTAMP_HEADER = "X-Webhook-Timestamp"
WEBHOOK_ID_HEADER = "X-Webhook-ID"
