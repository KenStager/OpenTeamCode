# Database migration definitions - NOT secrets
MIGRATIONS = {
    "001_create_users": """
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );
    """,
    "002_create_sessions": """
        CREATE TABLE sessions (
            id UUID PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            token_hash VARCHAR(255) NOT NULL,
            expires_at TIMESTAMP NOT NULL
        );
    """,
    "003_add_api_keys": """
        CREATE TABLE api_keys (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            key_hash VARCHAR(255) NOT NULL,
            name VARCHAR(100),
            created_at TIMESTAMP DEFAULT NOW()
        );
    """,
}

MIGRATION_VERSION = "003"
