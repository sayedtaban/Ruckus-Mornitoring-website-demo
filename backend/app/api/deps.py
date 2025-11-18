from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.models.user import User
from app.repositories.influx import InfluxWiFiMetricsRepository
from app.repositories.mock import MockWiFiMetricsRepository
from app.services.auth_service import AuthService
from app.services.metrics_service import WiFiMetricsService

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Dependency to get current authenticated user"""
    token = credentials.credentials
    user = AuthService.get_user_from_token(token, db)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        HTTPBearer(auto_error=False)
    ),
    db: Session = Depends(get_db),
) -> User | None:
    """Dependency to get current user if authenticated, None otherwise"""
    if credentials is None:
        return None
    token = credentials.credentials
    return AuthService.get_user_from_token(token, db)


def get_metrics_service() -> WiFiMetricsService:
    """Dependency to get WiFi metrics service instance"""
    try:
        settings = get_settings()
        
        if settings.data_backend == "mock":
            print(f"[Deps] Using MockWiFiMetricsRepository (data_backend={settings.data_backend})")
            repository = MockWiFiMetricsRepository()
        elif settings.data_backend == "influx":
            print(f"[Deps] Using InfluxWiFiMetricsRepository (data_backend={settings.data_backend})")
            print(f"[Deps] InfluxDB URL: {settings.influx_url}, Org: {settings.influx_org}, Bucket: {settings.influx_bucket}")
            repository = InfluxWiFiMetricsRepository(
                url=settings.influx_url,
                token=settings.influx_token,
                org=settings.influx_org,
                bucket=settings.influx_bucket,
            )
        else:
            raise ValueError(f"Unsupported data backend: {settings.data_backend}")
        
        return WiFiMetricsService(repository=repository)
    except Exception as e:
        # Log the error but DO NOT fallback to mock - raise the error instead
        print(f"[Deps] ERROR initializing {settings.data_backend} repository: {e}")
        print(f"[Deps] Raising exception instead of falling back to mock")
        raise
