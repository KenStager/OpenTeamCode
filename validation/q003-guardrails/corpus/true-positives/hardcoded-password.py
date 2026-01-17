# Python file with hardcoded credentials (TEST FILE)

def connect_to_database():
    # BAD: Hardcoded credentials
    password = "super_secret_password_123"
    pwd = "another_hardcoded_pwd_456"

    connection_string = f"postgres://admin:{password}@localhost/mydb"
    return connect(connection_string)

# More hardcoded secrets
API_KEY = "test_key_abcdefghijklmnopqrstuvwxyz123"
secret_token = "my_secret_token_1234567890abcdef"
