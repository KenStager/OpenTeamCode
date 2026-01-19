# Pagination utilities - NOT secrets
from dataclasses import dataclass
from typing import Generic, TypeVar, List

T = TypeVar("T")

@dataclass
class Page(Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int

    @property
    def has_next(self) -> bool:
        return self.page * self.page_size < self.total

    @property
    def has_prev(self) -> bool:
        return self.page > 1

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

def parse_pagination(page: int = 1, size: int = DEFAULT_PAGE_SIZE) -> tuple[int, int]:
    page = max(1, page)
    size = min(max(1, size), MAX_PAGE_SIZE)
    return page, size
