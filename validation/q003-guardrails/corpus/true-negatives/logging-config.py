# Logging configuration - NOT secrets
import logging

LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
LOG_LEVEL = logging.INFO

def setup_logging(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(LOG_LEVEL)
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter(LOG_FORMAT))
    logger.addHandler(handler)
    return logger

# Log sensitive data patterns (for redaction, not actual secrets)
SENSITIVE_PATTERNS = [
    r"password=\S+",
    r"api_key=\S+",
    r"token=\S+",
]
