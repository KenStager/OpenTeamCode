# Configuration schema definitions - NOT secrets
from typing import TypedDict, Optional

class DatabaseConfig(TypedDict):
    host: str
    port: int
    name: str
    user: str
    # Note: password loaded from environment, not defined here

class RedisConfig(TypedDict):
    host: str
    port: int
    db: int

class AppConfig(TypedDict):
    debug: bool
    log_level: str
    database: DatabaseConfig
    redis: Optional[RedisConfig]

# Default configuration (no secrets)
DEFAULT_CONFIG: AppConfig = {
    "debug": False,
    "log_level": "INFO",
    "database": {
        "host": "localhost",
        "port": 5432,
        "name": "myapp",
        "user": "app",
    },
    "redis": None,
}
