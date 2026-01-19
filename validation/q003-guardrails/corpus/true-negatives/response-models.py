# API response models - NOT secrets
from dataclasses import dataclass
from typing import Generic, TypeVar, Optional, List

T = TypeVar("T")

@dataclass
class ApiResponse(Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[str] = None

@dataclass
class ListResponse(Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int

@dataclass
class ErrorResponse:
    code: str
    message: str
    details: Optional[dict] = None

def success_response(data: T) -> ApiResponse[T]:
    return ApiResponse(success=True, data=data)

def error_response(message: str) -> ApiResponse:
    return ApiResponse(success=False, error=message)
