# HTTP client wrapper - NOT secrets
from typing import Optional, Dict, Any
import urllib.request
import json

DEFAULT_TIMEOUT = 30
DEFAULT_HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
}

class HttpClient:
    def __init__(self, base_url: str, timeout: int = DEFAULT_TIMEOUT):
        self.base_url = base_url
        self.timeout = timeout
        self.headers = DEFAULT_HEADERS.copy()

    def set_header(self, name: str, value: str) -> None:
        self.headers[name] = value

    def get(self, path: str) -> Dict[str, Any]:
        url = f"{self.base_url}{path}"
        req = urllib.request.Request(url, headers=self.headers)
        with urllib.request.urlopen(req, timeout=self.timeout) as response:
            return json.loads(response.read())
