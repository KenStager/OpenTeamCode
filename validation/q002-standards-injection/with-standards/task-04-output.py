# Task 4: File Upload Handler (WITH STANDARDS)

import os
import shutil
from dataclasses import dataclass
from typing import Optional

ALLOWED_EXTENSIONS: list[str] = [".jpg", ".png", ".pdf", ".doc", ".docx"]
MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB


class AppError(Exception):
    """Base class for application errors."""

    pass


class FileUploadError(AppError):
    """Base class for file upload errors."""

    pass


class FileNotFoundError(FileUploadError):
    """Raised when the source file does not exist."""

    pass


class InvalidFileTypeError(FileUploadError):
    """Raised when the file type is not allowed."""

    pass


class FileTooLargeError(FileUploadError):
    """Raised when the file exceeds the size limit."""

    pass


@dataclass
class UploadResult:
    """Represents the result of a successful file upload."""

    original_path: str
    destination_path: str
    file_size: int
    file_type: str


def _validate_file_exists(file_path: str) -> None:
    """Validate that the source file exists.

    Args:
        file_path: Path to the file to validate.

    Raises:
        FileNotFoundError: If the file does not exist.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Source file not found: {file_path}")


def _validate_file_type(file_path: str) -> str:
    """Validate and return the file extension.

    Args:
        file_path: Path to the file to validate.

    Returns:
        The lowercase file extension.

    Raises:
        InvalidFileTypeError: If the file type is not allowed.
    """
    extension = os.path.splitext(file_path)[1].lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise InvalidFileTypeError(
            f"File type '{extension}' not allowed. "
            f"Allowed types: {ALLOWED_EXTENSIONS}"
        )

    return extension


def _validate_file_size(file_path: str) -> int:
    """Validate and return the file size.

    Args:
        file_path: Path to the file to validate.

    Returns:
        The file size in bytes.

    Raises:
        FileTooLargeError: If the file exceeds the size limit.
    """
    size = os.path.getsize(file_path)

    if size > MAX_FILE_SIZE:
        raise FileTooLargeError(
            f"File size {size} bytes exceeds limit of {MAX_FILE_SIZE} bytes"
        )

    return size


def handle_upload(file_path: str, destination: str) -> UploadResult:
    """Handle a file upload with validation.

    Args:
        file_path: Path to the source file.
        destination: Path where the file should be copied.

    Returns:
        An UploadResult containing metadata about the uploaded file.

    Raises:
        FileNotFoundError: If the source file does not exist.
        InvalidFileTypeError: If the file type is not allowed.
        FileTooLargeError: If the file exceeds the size limit.
    """
    _validate_file_exists(file_path)
    file_type = _validate_file_type(file_path)
    file_size = _validate_file_size(file_path)

    destination_dir = os.path.dirname(destination)
    if destination_dir:
        os.makedirs(destination_dir, exist_ok=True)

    shutil.copy2(file_path, destination)

    return UploadResult(
        original_path=file_path,
        destination_path=destination,
        file_size=file_size,
        file_type=file_type,
    )


def upload_file(source: str, destination: str) -> Optional[UploadResult]:
    """Upload a file with error handling.

    Args:
        source: Path to the source file.
        destination: Path where the file should be copied.

    Returns:
        An UploadResult if successful, None if upload fails.
    """
    try:
        return handle_upload(source, destination)
    except FileUploadError:
        return None
