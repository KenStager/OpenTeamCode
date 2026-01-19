# Currency codes and formatting - NOT secrets
from dataclasses import dataclass
from decimal import Decimal

@dataclass
class Currency:
    code: str
    symbol: str
    decimal_places: int

CURRENCIES = {
    "USD": Currency("USD", "$", 2),
    "EUR": Currency("EUR", "€", 2),
    "GBP": Currency("GBP", "£", 2),
    "JPY": Currency("JPY", "¥", 0),
    "BTC": Currency("BTC", "₿", 8),
}

DEFAULT_CURRENCY = "USD"

def format_currency(amount: Decimal, currency_code: str) -> str:
    currency = CURRENCIES.get(currency_code, CURRENCIES[DEFAULT_CURRENCY])
    formatted = f"{amount:,.{currency.decimal_places}f}"
    return f"{currency.symbol}{formatted}"
