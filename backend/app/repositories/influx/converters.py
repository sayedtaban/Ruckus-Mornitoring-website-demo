from __future__ import annotations

from typing import Any, Sequence


IGNORED_FIELDS: Sequence[str] = ("result", "table", "_start", "_stop")


def tables_to_records(tables) -> list[dict[str, Any]]:
    """Convert Flux tables into simple dictionaries."""
    records: list[dict[str, Any]] = []
    for table in tables:
        for record in table.records:
            data: dict[str, Any] = {}
            for key, value in record.values.items():
                if key in IGNORED_FIELDS:
                    continue
                if key == "_time":
                    if hasattr(value, "isoformat"):
                        data["timestamp"] = value.isoformat()
                    else:
                        data["timestamp"] = value
                    continue
                if key.startswith("_"):
                    continue
                data[key] = value
            records.append(data)
    return records


def to_int(value: Any, default: int = 0) -> int:
    try:
        if value is None:
            return default
        if isinstance(value, bool):
            return int(value)
        return int(float(value))
    except (TypeError, ValueError):
        return default


def to_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


DEVICE_KEYWORDS: dict[str, str] = {
    "phone": "phone",
    "iphone": "phone",
    "ios": "phone",
    "android": "phone",
    "tablet": "tablet",
    "ipad": "tablet",
    "windows": "laptop",
    "mac": "laptop",
    "linux": "laptop",
    "pc": "laptop",
}


def classify_device(os_type: str) -> str:
    """Infer a device type from the operating system string."""
    os_lower = (os_type or "").lower()
    for keyword, device in DEVICE_KEYWORDS.items():
        if keyword in os_lower:
            return device
    return "other"
