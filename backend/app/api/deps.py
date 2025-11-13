from __future__ import annotations

from functools import lru_cache
from typing import Annotated

from fastapi import Depends

from app.core.config import Settings, get_settings
from app.repositories.base import WiFiMetricsRepository
from app.repositories.influx import InfluxWiFiMetricsRepository
from app.repositories.mock import MockWiFiMetricsRepository
from app.services.metrics_service import WiFiMetricsService


@lru_cache
def _get_repository(
    data_backend: str,
    influx_url: str | None,
    influx_token: str | None,
    influx_org: str | None,
    influx_bucket: str | None,
) -> WiFiMetricsRepository:
    if data_backend == "mock":
        return MockWiFiMetricsRepository()
    if data_backend == "influx":
        if any(
            item in {None, ""}
            for item in (influx_url, influx_token, influx_org, influx_bucket)
        ):
            raise ValueError("InfluxDB configuration is incomplete.")
        return InfluxWiFiMetricsRepository(
            url=influx_url,
            token=influx_token,
            org=influx_org,
            bucket=influx_bucket,
        )
    raise ValueError(f"Unsupported data backend: {data_backend}")


def get_repository(
    settings: Annotated[
        Settings,
        Depends(get_settings),
    ],
) -> WiFiMetricsRepository:
    return _get_repository(
        settings.data_backend,
        settings.influx_url,
        settings.influx_token,
        settings.influx_org,
        settings.influx_bucket,
    )


def get_metrics_service(
    repository: Annotated[WiFiMetricsRepository, Depends(get_repository)],
) -> WiFiMetricsService:
    return WiFiMetricsService(repository)
