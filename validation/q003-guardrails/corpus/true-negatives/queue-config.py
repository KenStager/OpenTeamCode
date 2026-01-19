# Message queue configuration - NOT secrets
QUEUE_NAME_PREFIX = "myapp"
DEFAULT_VISIBILITY_TIMEOUT = 30
DEFAULT_MESSAGE_RETENTION = 86400 * 7  # 7 days

QUEUE_NAMES = {
    "email": f"{QUEUE_NAME_PREFIX}_email_queue",
    "notifications": f"{QUEUE_NAME_PREFIX}_notifications_queue",
    "tasks": f"{QUEUE_NAME_PREFIX}_background_tasks",
}

def get_queue_url(queue_name: str, region: str = "us-east-1") -> str:
    # Construct URL (no secrets in URL pattern)
    return f"https://sqs.{region}.amazonaws.com/123456789012/{queue_name}"

def get_dead_letter_queue(queue_name: str) -> str:
    return f"{queue_name}_dlq"
