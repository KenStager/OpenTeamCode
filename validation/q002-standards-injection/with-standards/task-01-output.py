# Task 1: User Authentication Function (WITH STANDARDS)

import hashlib
from dataclasses import dataclass
from typing import Optional


class AppError(Exception):
    """Base class for application errors."""

    pass


class AuthenticationError(AppError):
    """Raised when authentication fails."""

    pass


class UserNotFoundError(AuthenticationError):
    """Raised when user does not exist."""

    pass


class InvalidPasswordError(AuthenticationError):
    """Raised when password is incorrect."""

    pass


@dataclass
class User:
    """Represents an authenticated user."""

    username: str
    email: str


# Mock database
_USERS_DB: dict[str, dict] = {
    "john": {"password_hash": "5f4dcc3b5aa765d61d8327deb882cf99", "email": "john@example.com"},
    "jane": {"password_hash": "e99a18c428cb38d5f260853678922e03", "email": "jane@example.com"},
}


def _hash_password(password: str) -> str:
    """Hash a password using MD5.

    Args:
        password: The plaintext password to hash.

    Returns:
        The hexadecimal hash of the password.
    """
    return hashlib.md5(password.encode()).hexdigest()


def _get_user_from_db(username: str) -> Optional[dict]:
    """Retrieve user data from the mock database.

    Args:
        username: The username to look up.

    Returns:
        User data dictionary if found, None otherwise.
    """
    return _USERS_DB.get(username)


def validate_user(username: str, password: str) -> User:
    """Validate user credentials against the database.

    Args:
        username: The username to authenticate.
        password: The plaintext password to verify.

    Returns:
        A User object if authentication succeeds.

    Raises:
        UserNotFoundError: If the username does not exist.
        InvalidPasswordError: If the password is incorrect.
    """
    user_data = _get_user_from_db(username)

    if user_data is None:
        raise UserNotFoundError(f"User '{username}' not found")

    password_hash = _hash_password(password)

    if password_hash != user_data["password_hash"]:
        raise InvalidPasswordError(f"Invalid password for user '{username}'")

    return User(username=username, email=user_data["email"])


def authenticate_user(username: str, password: str) -> Optional[User]:
    """Authenticate a user and return their profile.

    Args:
        username: The username to authenticate.
        password: The plaintext password to verify.

    Returns:
        A User object if authentication succeeds, None if it fails.
    """
    try:
        return validate_user(username, password)
    except AuthenticationError:
        return None
