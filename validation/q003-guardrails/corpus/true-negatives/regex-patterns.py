# Regular expression patterns - NOT secrets
# These complex patterns might look suspicious but are just regex

import re

# Validation patterns
EMAIL_PATTERN = re.compile(
    r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
)

PHONE_PATTERN = re.compile(
    r"^\+?[1-9]\d{1,14}$"
)

URL_PATTERN = re.compile(
    r"^https?://[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+(/.*)?$"
)

# ID patterns (format validation, not actual secrets)
UUID_PATTERN = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    re.IGNORECASE
)

API_KEY_FORMAT = re.compile(
    r"^[a-zA-Z]{2,4}_[a-zA-Z0-9]{20,40}$"
)
