"""Configuration settings for the FastAPI application."""
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Optional, List, Union


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # API Settings
    api_title: str = "Ruckus Dashboard API"
    api_version: str = "1.0.0"
    api_prefix: str = "/api"

    # InfluxDB Settings
    influxdb_url: str = "http://localhost:8086"
    influxdb_token: Optional[str] = (
        "vmEv3xPIBXM0iiW6rBQ8KKPZB7hdbjqbPJVtN0mrO0Cn96RhTGWP647J9K-lo-6m"
        "mB0_sQRvHLDdFgHrGb8GRQ=="
    )
    influxdb_org: str = "wifi-org"
    influxdb_bucket: str = "wifi-streaming"

    # Authentication
    jwt_secret_key: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 30

    # CORS
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]):
        """Allow comma-separated CORS origins via env (CORS_ORIGINS=a,b,c)."""
        if isinstance(v, str):
            # split by comma and strip whitespace
            return [o.strip() for o in v.split(",") if o.strip()]
        return v

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
