# Pattern: Configuration Loading

## Context
Loading application configuration from multiple sources with proper precedence.

## Problem
Configuration scattered across:
- Environment variables
- Config files (YAML, JSON)
- Command line arguments
- Defaults

Without a standard approach, it's unclear which source takes precedence.

## Solution

### Configuration Precedence (highest to lowest)
1. Command line arguments
2. Environment variables
3. Local config file (`.env.local`, `config.local.yaml`)
4. Environment-specific config (`config.{env}.yaml`)
5. Default config (`config.yaml`)
6. Code defaults

### Implementation

```python
from dataclasses import dataclass, field
from typing import Optional
import os
import yaml

@dataclass
class DatabaseConfig:
    host: str = "localhost"
    port: int = 5432
    name: str = "app"
    user: str = "app"
    password: Optional[str] = None

    @classmethod
    def from_env(cls) -> "DatabaseConfig":
        return cls(
            host=os.getenv("DB_HOST", cls.host),
            port=int(os.getenv("DB_PORT", cls.port)),
            name=os.getenv("DB_NAME", cls.name),
            user=os.getenv("DB_USER", cls.user),
            password=os.getenv("DB_PASSWORD"),
        )


@dataclass
class AppConfig:
    environment: str = "development"
    debug: bool = False
    database: DatabaseConfig = field(default_factory=DatabaseConfig)

    @classmethod
    def load(cls, config_path: Optional[str] = None) -> "AppConfig":
        """Load configuration with proper precedence."""
        config = cls()

        # Load from file if exists
        if config_path and os.path.exists(config_path):
            with open(config_path) as f:
                file_config = yaml.safe_load(f)
                config = cls._merge(config, file_config)

        # Override with environment variables
        config.environment = os.getenv("APP_ENV", config.environment)
        config.debug = os.getenv("DEBUG", str(config.debug)).lower() == "true"
        config.database = DatabaseConfig.from_env()

        return config
```

## Validation

Always validate configuration at startup:

```python
def validate_config(config: AppConfig) -> list[str]:
    """Validate configuration and return list of errors."""
    errors = []

    if config.environment == "production":
        if config.debug:
            errors.append("Debug mode should not be enabled in production")
        if not config.database.password:
            errors.append("Database password is required in production")

    return errors
```

## Team Decision
- Adopted: 2024-01-15
- Last Updated: 2024-01-15
