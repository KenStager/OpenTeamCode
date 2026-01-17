# Test fixtures with mock credentials
# Should NOT trigger (or low confidence only) due to test context

import pytest

# Mock credentials for testing - clearly fake
MOCK_API_KEY = "test_key_for_unit_tests_only"
FAKE_PASSWORD = "fake_password_for_testing"
EXAMPLE_TOKEN = "example_token_placeholder"
DUMMY_SECRET = "dummy_secret_not_real"

class MockAuthService:
    """Mock authentication service for testing."""

    def __init__(self):
        # These are intentionally fake for testing
        self.api_key = "your_api_key_here"
        self.secret = "xxxxxxxxxxxxxxxxxxxxxxxx"

    def authenticate(self, token: str) -> bool:
        """Mock authentication - always returns True in tests."""
        return token == "test_token"


@pytest.fixture
def mock_credentials():
    """Fixture providing mock credentials for tests."""
    return {
        "username": "testuser",
        "password": "testpassword123",  # Fake test password
        "api_key": "sk_test_placeholder_key",
    }
