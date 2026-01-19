# Metrics collection - NOT secrets
from dataclasses import dataclass, field
from typing import Dict
import time

@dataclass
class Counter:
    name: str
    value: int = 0
    labels: Dict[str, str] = field(default_factory=dict)

    def increment(self, amount: int = 1) -> None:
        self.value += amount

@dataclass
class Gauge:
    name: str
    value: float = 0.0
    labels: Dict[str, str] = field(default_factory=dict)

    def set(self, value: float) -> None:
        self.value = value

# Metric names (not secrets)
REQUESTS_TOTAL = "http_requests_total"
REQUEST_DURATION = "http_request_duration_seconds"
ACTIVE_CONNECTIONS = "active_connections"
ERROR_RATE = "error_rate"
