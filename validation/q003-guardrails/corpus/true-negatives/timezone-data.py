# Timezone configuration - NOT secrets
from datetime import timezone, timedelta

TIMEZONES = {
    "UTC": timezone.utc,
    "EST": timezone(timedelta(hours=-5)),
    "PST": timezone(timedelta(hours=-8)),
    "CET": timezone(timedelta(hours=1)),
    "JST": timezone(timedelta(hours=9)),
}

TIMEZONE_NAMES = {
    "America/New_York": "Eastern Time",
    "America/Los_Angeles": "Pacific Time",
    "Europe/London": "British Time",
    "Europe/Paris": "Central European Time",
    "Asia/Tokyo": "Japan Standard Time",
}

DEFAULT_TIMEZONE = "UTC"

def get_timezone_offset(tz_name: str) -> int:
    offsets = {
        "UTC": 0, "EST": -5, "PST": -8, "CET": 1, "JST": 9
    }
    return offsets.get(tz_name, 0)
