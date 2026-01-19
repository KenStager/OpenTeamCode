# Enum definitions - NOT secrets
from enum import Enum, auto

class UserRole(Enum):
    ADMIN = "admin"
    USER = "user"
    GUEST = "guest"

class OrderStatus(Enum):
    PENDING = auto()
    PROCESSING = auto()
    SHIPPED = auto()
    DELIVERED = auto()
    CANCELLED = auto()

class PaymentMethod(Enum):
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    BANK_TRANSFER = "bank_transfer"
    PAYPAL = "paypal"

class AuthType(Enum):
    API_KEY = "api_key"
    BEARER = "bearer"
    BASIC = "basic"
