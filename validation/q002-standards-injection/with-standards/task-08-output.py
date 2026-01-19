# Task 8: Configuration Loader (WITH STANDARDS)

import os
from dataclasses import dataclass, field
from typing import Any, Optional

import yaml


class AppError(Exception):
    """Base class for application errors."""

    pass


class ConfigurationError(AppError):
    """Raised when configuration loading or validation fails."""

    pass


class MissingConfigError(ConfigurationError):
    """Raised when required configuration is missing."""

    pass


DEFAULT_ENV_PREFIX: str = "APP_"


@dataclass
class AppConfig:
    """Application configuration container.

    Attributes:
        debug: Whether debug mode is enabled.
        port: The server port number.
        host: The server host address.
        extra: Additional configuration values.
    """

    debug: bool = False
    port: int = 8080
    host: str = "localhost"
    extra: dict[str, Any] = field(default_factory=dict)


def _load_from_environment(prefix: str = DEFAULT_ENV_PREFIX) -> dict[str, Any]:
    """Load configuration from environment variables.

    Args:
        prefix: The prefix to filter environment variables.

    Returns:
        A dictionary of configuration values from environment.
    """
    config: dict[str, Any] = {}

    for key, value in os.environ.items():
        if key.startswith(prefix):
            config_key = key[len(prefix):].lower()
            config[config_key] = value

    return config


def _load_from_file(filepath: str) -> dict[str, Any]:
    """Load configuration from a YAML file.

    Args:
        filepath: Path to the YAML configuration file.

    Returns:
        A dictionary of configuration values from the file.

    Raises:
        ConfigurationError: If the file cannot be parsed.
    """
    try:
        with open(filepath, "r") as file:
            return yaml.safe_load(file) or {}
    except FileNotFoundError:
        return {}
    except yaml.YAMLError as e:
        raise ConfigurationError(f"Invalid YAML in {filepath}: {e}") from e


def _validate_required(
    config: dict[str, Any],
    required: list[str],
) -> None:
    """Validate that required configuration keys are present.

    Args:
        config: The configuration dictionary to validate.
        required: List of required configuration keys.

    Raises:
        MissingConfigError: If any required keys are missing.
    """
    missing = [key for key in required if key not in config or config[key] is None]

    if missing:
        raise MissingConfigError(f"Missing required configuration: {missing}")


def load_config(
    config_file: Optional[str] = None,
    required: Optional[list[str]] = None,
    env_prefix: str = DEFAULT_ENV_PREFIX,
) -> dict[str, Any]:
    """Load configuration from multiple sources with precedence.

    Configuration is loaded in the following order (later sources override):
    1. Default values
    2. YAML configuration file
    3. Environment variables

    Args:
        config_file: Optional path to a YAML configuration file.
        required: Optional list of required configuration keys.
        env_prefix: Prefix for environment variables.

    Returns:
        The merged configuration dictionary.

    Raises:
        ConfigurationError: If the config file is invalid.
        MissingConfigError: If required configuration is missing.
    """
    config: dict[str, Any] = {
        "debug": False,
        "port": 8080,
        "host": "localhost",
    }

    if config_file:
        file_config = _load_from_file(config_file)
        config.update(file_config)

    env_config = _load_from_environment(env_prefix)
    config.update(env_config)

    if required:
        _validate_required(config, required)

    return config


def get_app_config(config_file: str = "config.yaml") -> AppConfig:
    """Load and return typed application configuration.

    Args:
        config_file: Path to the configuration file.

    Returns:
        An AppConfig instance with loaded values.

    Raises:
        MissingConfigError: If required configuration is missing.
    """
    config = load_config(config_file, required=["database_url"])

    return AppConfig(
        debug=config.get("debug", False),
        port=int(config.get("port", 8080)),
        host=config.get("host", "localhost"),
        extra={k: v for k, v in config.items() if k not in ["debug", "port", "host"]},
    )
