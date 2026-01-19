# Feature flag definitions - NOT secrets
from typing import Dict, Set

FEATURE_FLAGS: Dict[str, bool] = {
    "new_dashboard": True,
    "dark_mode": True,
    "beta_features": False,
    "experimental_api": False,
}

FEATURE_ROLLOUT_PERCENTAGES: Dict[str, int] = {
    "new_checkout": 50,
    "recommendations": 25,
    "ai_assistant": 10,
}

ADMIN_ONLY_FEATURES: Set[str] = {
    "debug_mode",
    "impersonation",
    "audit_logs",
}

def is_feature_enabled(feature: str, user_id: str = None) -> bool:
    return FEATURE_FLAGS.get(feature, False)
