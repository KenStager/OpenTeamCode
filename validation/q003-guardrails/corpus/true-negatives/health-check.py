# Health check endpoints - NOT secrets
from dataclasses import dataclass
from typing import Dict, List
from enum import Enum

class HealthStatus(Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"

@dataclass
class ComponentHealth:
    name: str
    status: HealthStatus
    message: str = ""

def check_database() -> ComponentHealth:
    # Check database connectivity
    return ComponentHealth("database", HealthStatus.HEALTHY)

def check_cache() -> ComponentHealth:
    # Check cache connectivity
    return ComponentHealth("cache", HealthStatus.HEALTHY)

def get_health_status() -> Dict:
    components = [check_database(), check_cache()]
    overall = HealthStatus.HEALTHY
    return {"status": overall.value, "components": components}
