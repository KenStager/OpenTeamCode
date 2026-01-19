# Task 1: User Authentication Function (WITHOUT STANDARDS)

import hashlib

# Mock database
users_db = {
    "john": {"password_hash": "5f4dcc3b5aa765d61d8327deb882cf99", "email": "john@example.com"},
    "jane": {"password_hash": "e99a18c428cb38d5f260853678922e03", "email": "jane@example.com"}
}

def validateUser(username, password):
    """Validate user credentials"""
    try:
        if username not in users_db:
            raise Exception("User not found")

        user = users_db[username]
        password_hash = hashlib.md5(password.encode()).hexdigest()

        if password_hash != user["password_hash"]:
            raise Exception("Invalid password")

        return {"username": username, "email": user["email"]}
    except:
        return None


def authenticateUser(username, pwd):
    result = validateUser(username, pwd)
    if result is None:
        print("Authentication failed")
        return False
    return result
