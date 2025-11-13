from dataclasses import dataclass, field
from functools import lru_cache
from typing import List


@dataclass(frozen=True)
class Settings:
    """Hard-coded application configuration."""

    app_name: str = "WiFi Monitoring API"
    api_prefix: str = "/api"
    influx_url: str = "http://20.64.233.185:8086"
    influx_token: str = (
        "NVmRj218iGEZbkWEVUokEO2AP3JTasaVhbfEhGk_6okfepun8HzWBxfyb1nEk0ENNnXuU8qoJsFy7m2ykcyrsA=="
    )
    influx_org: str = "wifi-org"
    influx_bucket: str = "demo"
    data_backend: str = "influx"  # "mock" | "influx"
    enable_cors: bool = True
    cors_allow_origins: List[str] = field(default_factory=lambda: ["*"])
    cors_allow_credentials: bool = True
    cors_allow_methods: List[str] = field(default_factory=lambda: ["*"])
    cors_allow_headers: List[str] = field(default_factory=lambda: ["*"])


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings instance."""

    return Settings()
