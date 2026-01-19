# Retry logic with backoff - NOT secrets
import time
import random
from typing import Callable, TypeVar

T = TypeVar("T")

MAX_RETRIES = 3
BASE_DELAY = 1.0
MAX_DELAY = 30.0

def exponential_backoff(attempt: int) -> float:
    delay = BASE_DELAY * (2 ** attempt)
    jitter = random.uniform(0, 0.1 * delay)
    return min(delay + jitter, MAX_DELAY)

def retry_with_backoff(func: Callable[[], T], max_retries: int = MAX_RETRIES) -> T:
    last_exception = None
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            last_exception = e
            time.sleep(exponential_backoff(attempt))
    raise last_exception
