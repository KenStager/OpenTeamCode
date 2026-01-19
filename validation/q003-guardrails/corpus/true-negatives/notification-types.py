# Notification type definitions - NOT secrets
from enum import Enum
from dataclasses import dataclass
from typing import Optional

class NotificationType(Enum):
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    WEBHOOK = "webhook"

class NotificationPriority(Enum):
    LOW = 1
    NORMAL = 2
    HIGH = 3
    URGENT = 4

@dataclass
class NotificationTemplate:
    template_id: str
    name: str
    subject: str
    body_template: str

TEMPLATES = {
    "welcome": NotificationTemplate(
        template_id="tmpl_welcome_001",
        name="Welcome Email",
        subject="Welcome to Our Service",
        body_template="Hello {name}, welcome to our platform!",
    ),
}
