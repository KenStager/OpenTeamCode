# Task 6: Email Notification Service (WITH STANDARDS)

import re
from dataclasses import dataclass
from typing import Optional

EMAIL_PATTERN: str = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"


class AppError(Exception):
    """Base class for application errors."""

    pass


class EmailError(AppError):
    """Base class for email-related errors."""

    pass


class InvalidEmailError(EmailError):
    """Raised when an email address is invalid."""

    pass


class InvalidContentError(EmailError):
    """Raised when email content is invalid."""

    pass


@dataclass
class EmailResult:
    """Represents the result of sending an email."""

    success: bool
    recipient: Optional[str] = None
    error: Optional[str] = None


def _validate_email_address(email: str) -> None:
    """Validate an email address format.

    Args:
        email: The email address to validate.

    Raises:
        InvalidEmailError: If the email format is invalid.
    """
    if not re.match(EMAIL_PATTERN, email):
        raise InvalidEmailError(f"Invalid email address: {email}")


def _validate_content(subject: str, body: str) -> None:
    """Validate email subject and body content.

    Args:
        subject: The email subject line.
        body: The email body content.

    Raises:
        InvalidContentError: If subject or body is empty.
    """
    if not subject or not subject.strip():
        raise InvalidContentError("Email subject is required")

    if not body:
        raise InvalidContentError("Email body is required")


def send_email(recipient: str, subject: str, body: str) -> EmailResult:
    """Send an email notification.

    Args:
        recipient: The email address to send to.
        subject: The email subject line.
        body: The email body content.

    Returns:
        An EmailResult indicating success or failure.
    """
    try:
        _validate_email_address(recipient)
        _validate_content(subject, body)
    except EmailError as e:
        return EmailResult(success=False, error=str(e))

    # Mock sending (print instead of actual send)
    print(f"Sending email to: {recipient}")
    print(f"Subject: {subject}")
    print(f"Body: {body[:100]}...")

    return EmailResult(success=True, recipient=recipient)


def notify_user(
    user_email: str,
    message: str,
    title: str = "Notification",
) -> EmailResult:
    """Send a notification to a user.

    Args:
        user_email: The user's email address.
        message: The notification message body.
        title: The notification title. Defaults to "Notification".

    Returns:
        An EmailResult indicating success or failure.
    """
    return send_email(user_email, title, message)
