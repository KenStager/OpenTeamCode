# SMTP Configuration with credentials (TEST FILE)

SMTP_HOST = "smtp.example.com"
SMTP_PORT = 587
SMTP_USER = "notifications@example.com"
SMTP_PASSWORD = "smtp_password_123456789"

EMAIL_API_KEY = "email_api_key_abcdefghijklmno"

def get_smtp_config():
    return {
        "host": SMTP_HOST,
        "password": "another_smtp_password_value"
    }
