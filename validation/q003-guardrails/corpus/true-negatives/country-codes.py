# Country codes - NOT secrets
COUNTRY_CODES = {
    "US": "United States",
    "GB": "United Kingdom",
    "CA": "Canada",
    "AU": "Australia",
    "DE": "Germany",
    "FR": "France",
    "JP": "Japan",
    "CN": "China",
    "IN": "India",
    "BR": "Brazil",
}

PHONE_PREFIXES = {
    "US": "+1",
    "GB": "+44",
    "CA": "+1",
    "AU": "+61",
    "DE": "+49",
    "FR": "+33",
    "JP": "+81",
    "CN": "+86",
    "IN": "+91",
    "BR": "+55",
}

def get_country_name(code: str) -> str:
    return COUNTRY_CODES.get(code.upper(), "Unknown")
