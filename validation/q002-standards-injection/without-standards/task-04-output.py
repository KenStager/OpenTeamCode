# Task 4: File Upload Handler (WITHOUT STANDARDS)

import os
import shutil

ALLOWED_TYPES = [".jpg", ".png", ".pdf", ".doc", ".docx"]
MAX_SIZE = 10 * 1024 * 1024  # 10MB

def handleUpload(filePath, destination):
    """Handle file upload"""
    # Check if file exists
    if not os.path.exists(filePath):
        raise Exception("File not found")

    # Check file type
    ext = os.path.splitext(filePath)[1].lower()
    if ext not in ALLOWED_TYPES:
        raise Exception(f"File type {ext} not allowed")

    # Check file size
    size = os.path.getsize(filePath)
    if size > MAX_SIZE:
        raise Exception("File too large")

    # Create destination directory if needed
    os.makedirs(os.path.dirname(destination), exist_ok=True)

    # Copy file
    shutil.copy2(filePath, destination)

    return {
        "originalPath": filePath,
        "destinationPath": destination,
        "fileSize": size,
        "fileType": ext
    }


def uploadFile(src, dest):
    try:
        return handleUpload(src, dest)
    except Exception as e:
        print(f"Upload failed: {e}")
        return None
