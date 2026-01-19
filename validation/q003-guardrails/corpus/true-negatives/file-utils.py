# File utilities - NOT secrets
import os
from pathlib import Path
from typing import Iterator

ALLOWED_EXTENSIONS = {".txt", ".json", ".yaml", ".yml", ".md"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def get_file_extension(filename: str) -> str:
    return Path(filename).suffix.lower()

def is_allowed_file(filename: str) -> bool:
    return get_file_extension(filename) in ALLOWED_EXTENSIONS

def iter_files(directory: str, pattern: str = "*") -> Iterator[Path]:
    return Path(directory).glob(pattern)

def safe_filename(filename: str) -> str:
    # Remove potentially dangerous characters
    return "".join(c for c in filename if c.isalnum() or c in "._-")
