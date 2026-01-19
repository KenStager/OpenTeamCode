# Task 8: Configuration Loader (WITHOUT STANDARDS)

import os
import yaml

def loadFromEnv(prefix="APP_"):
    """Load config from environment variables"""
    config = {}
    for key, value in os.environ.items():
        if key.startswith(prefix):
            configKey = key[len(prefix):].lower()
            config[configKey] = value
    return config


def loadFromFile(filepath):
    """Load config from YAML file"""
    try:
        with open(filepath, 'r') as f:
            return yaml.safe_load(f) or {}
    except FileNotFoundError:
        return {}
    except:
        print(f"Error loading config file: {filepath}")
        return {}


def loadConfig(configFile=None, required=None):
    """Load configuration from multiple sources"""
    # Start with defaults
    config = {
        "debug": False,
        "port": 8080,
        "host": "localhost"
    }

    # Load from file (lower precedence)
    if configFile:
        fileConfig = loadFromFile(configFile)
        config.update(fileConfig)

    # Load from environment (higher precedence)
    envConfig = loadFromEnv()
    config.update(envConfig)

    # Validate required settings
    if required:
        missing = [r for r in required if r not in config or config[r] is None]
        if missing:
            raise Exception(f"Missing required config: {missing}")

    return config


def getConfig():
    return loadConfig("config.yaml", required=["database_url"])
