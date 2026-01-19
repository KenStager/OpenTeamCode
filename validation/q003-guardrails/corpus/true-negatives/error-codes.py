# Error codes and messages - NOT secrets
from enum import Enum

class ErrorCode(Enum):
    INVALID_INPUT = "E001"
    NOT_FOUND = "E002"
    UNAUTHORIZED = "E003"
    FORBIDDEN = "E004"
    RATE_LIMITED = "E005"

ERROR_MESSAGES = {
    ErrorCode.INVALID_INPUT: "The provided input is invalid",
    ErrorCode.NOT_FOUND: "Resource not found",
    ErrorCode.UNAUTHORIZED: "Authentication required",
    ErrorCode.FORBIDDEN: "Access denied",
    ErrorCode.RATE_LIMITED: "Too many requests",
}

# Error ID format (not a secret)
ERROR_ID_PREFIX = "err_"
