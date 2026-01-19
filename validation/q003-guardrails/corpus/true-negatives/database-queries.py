# Database query templates - NOT secrets
SQL_SELECT_USER = """
    SELECT id, email, created_at
    FROM users
    WHERE id = %s
"""

SQL_INSERT_USER = """
    INSERT INTO users (email, password_hash, created_at)
    VALUES (%s, %s, NOW())
    RETURNING id
"""

SQL_UPDATE_PASSWORD = """
    UPDATE users
    SET password_hash = %s, updated_at = NOW()
    WHERE id = %s
"""

# Table names
TABLE_USERS = "users"
TABLE_SESSIONS = "sessions"
TABLE_AUDIT_LOG = "audit_log"
