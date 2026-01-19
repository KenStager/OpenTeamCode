# Database configuration with hardcoded credentials (TEST FILE)

DB_HOST = "localhost"
DB_PORT = 5432
DB_NAME = "production_db"
DB_USER = "admin"
DB_PASSWORD = "super_secret_db_password_123"

def get_connection_string():
    password = "another_db_password_456"
    return f"postgresql://{DB_USER}:{password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
