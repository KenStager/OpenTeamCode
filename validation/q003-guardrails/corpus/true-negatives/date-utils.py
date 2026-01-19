# Date and time utilities - NOT secrets
from datetime import datetime, timedelta, timezone

ISO_FORMAT = "%Y-%m-%dT%H:%M:%SZ"
DATE_FORMAT = "%Y-%m-%d"
TIME_FORMAT = "%H:%M:%S"

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

def parse_iso_date(date_str: str) -> datetime:
    return datetime.strptime(date_str, ISO_FORMAT)

def format_iso_date(dt: datetime) -> str:
    return dt.strftime(ISO_FORMAT)

def days_ago(days: int) -> datetime:
    return utc_now() - timedelta(days=days)
