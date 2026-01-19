# Webhook configuration with secrets (TEST FILE)

GITHUB_WEBHOOK_SECRET = "github_webhook_secret_12345678"
STRIPE_WEBHOOK_SECRET = "whsec_abcdefghijklmnopqrstuvwxyz"
SLACK_SIGNING_SECRET = "slack_signing_secret_abc123def"

def verify_github_webhook(payload, signature):
    secret = "another_webhook_secret_value"
    # verification logic here
    pass
