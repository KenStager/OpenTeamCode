# Task 6: Email Notification Service (WITHOUT STANDARDS)

import re

def validateEmail(email):
    """Check if email is valid"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def sendEmail(recipient, subject, body):
    """Send an email notification"""
    # Validate email
    if not validateEmail(recipient):
        return {"success": False, "error": "Invalid email address"}

    # Validate subject and body
    if not subject or not subject.strip():
        return {"success": False, "error": "Subject is required"}

    if not body:
        return {"success": False, "error": "Body is required"}

    # Mock sending (print instead of actual send)
    print(f"Sending email to: {recipient}")
    print(f"Subject: {subject}")
    print(f"Body: {body[:100]}...")

    return {"success": True, "recipient": recipient}


def notifyUser(userEmail, message, title="Notification"):
    return sendEmail(userEmail, title, message)
