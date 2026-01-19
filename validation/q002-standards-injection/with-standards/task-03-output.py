# Task 3: Data Processing Pipeline (WITH STANDARDS)

from dataclasses import dataclass
from datetime import datetime
from typing import Any

REQUIRED_FIELDS: list[str] = ["name", "email", "date"]
DATE_FORMAT: str = "%Y-%m-%d"


class AppError(Exception):
    """Base class for application errors."""

    pass


class ValidationError(AppError):
    """Raised when record validation fails."""

    pass


@dataclass
class ProcessedRecord:
    """Represents a successfully processed record."""

    name: str
    email: str
    date: datetime
    processed: bool = True


@dataclass
class RecordError:
    """Represents a validation error for a record."""

    index: int
    error: str


def _validate_required_fields(record: dict[str, Any], index: int) -> None:
    """Validate that a record has all required fields.

    Args:
        record: The record dictionary to validate.
        index: The index of the record in the original list.

    Raises:
        ValidationError: If required fields are missing.
    """
    missing = [field for field in REQUIRED_FIELDS if field not in record]

    if missing:
        raise ValidationError(f"Missing required fields: {missing}")


def _transform_record(record: dict[str, Any]) -> ProcessedRecord:
    """Transform a raw record into a processed record.

    Args:
        record: The validated record dictionary.

    Returns:
        A ProcessedRecord with normalized data.

    Raises:
        ValidationError: If date parsing fails.
    """
    try:
        parsed_date = datetime.strptime(record["date"], DATE_FORMAT)
    except ValueError as e:
        raise ValidationError(f"Invalid date format: {record['date']}") from e

    return ProcessedRecord(
        name=record["name"].strip().title(),
        email=record["email"].lower().strip(),
        date=parsed_date,
    )


def process_records(
    records: list[dict[str, Any]],
) -> tuple[list[ProcessedRecord], list[RecordError]]:
    """Process a list of records with validation and transformation.

    Args:
        records: A list of record dictionaries to process.

    Returns:
        A tuple containing:
            - List of successfully processed records
            - List of validation errors for failed records
    """
    processed: list[ProcessedRecord] = []
    errors: list[RecordError] = []

    for index, record in enumerate(records):
        try:
            _validate_required_fields(record, index)
            transformed = _transform_record(record)
            processed.append(transformed)
        except ValidationError as e:
            errors.append(RecordError(index=index, error=str(e)))

    return processed, errors


def validate_and_process(
    data: Any,
) -> tuple[list[ProcessedRecord], list[RecordError]]:
    """Validate input and process records.

    Args:
        data: Input data that should be a list of dictionaries.

    Returns:
        A tuple of processed records and errors.
    """
    if not isinstance(data, list):
        return [], [RecordError(index=-1, error="Input must be a list")]

    return process_records(data)
