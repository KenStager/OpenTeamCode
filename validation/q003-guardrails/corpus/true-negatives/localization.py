# Localization strings - NOT secrets
SUPPORTED_LOCALES = ["en", "es", "fr", "de", "ja"]
DEFAULT_LOCALE = "en"

TRANSLATIONS = {
    "en": {
        "welcome": "Welcome",
        "login": "Log In",
        "password": "Password",
        "api_key": "API Key",
        "secret": "Secret",
    },
    "es": {
        "welcome": "Bienvenido",
        "login": "Iniciar sesión",
        "password": "Contraseña",
        "api_key": "Clave API",
        "secret": "Secreto",
    },
}

def translate(key: str, locale: str = DEFAULT_LOCALE) -> str:
    return TRANSLATIONS.get(locale, {}).get(key, key)
