# Legitimate base64 encoding operations
# Should NOT trigger secret detection

import base64

def encode_data(data: bytes) -> str:
    """Encode binary data to base64 string."""
    return base64.b64encode(data).decode('utf-8')

def decode_data(encoded: str) -> bytes:
    """Decode base64 string to binary data."""
    return base64.b64decode(encoded)

# Example usage with test data
test_data = b"Hello, World! This is a test message."
encoded = encode_data(test_data)
# Output: SGVsbG8sIFdvcmxkISBUaGlzIGlzIGEgdGVzdCBtZXNzYWdlLg==

# Longer base64 strings from image processing
image_header = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk"
pdf_header = "JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI"
