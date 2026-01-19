# Permission definitions - NOT secrets
from enum import Flag, auto
from typing import Set

class Permission(Flag):
    READ = auto()
    WRITE = auto()
    DELETE = auto()
    ADMIN = auto()

ROLE_PERMISSIONS = {
    "viewer": Permission.READ,
    "editor": Permission.READ | Permission.WRITE,
    "admin": Permission.READ | Permission.WRITE | Permission.DELETE | Permission.ADMIN,
}

RESOURCE_PERMISSIONS = {
    "users": {"list", "read", "create", "update", "delete"},
    "documents": {"list", "read", "create", "update", "delete", "share"},
    "settings": {"read", "update"},
}

def has_permission(role: str, permission: Permission) -> bool:
    return permission in ROLE_PERMISSIONS.get(role, Permission(0))
