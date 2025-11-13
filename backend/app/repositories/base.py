from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class WiFiMetricsRepository(ABC):
    """Abstract repository that provides access to WiFi monitoring metrics."""

    @abstractmethod
    async def get_venue(self) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    async def get_zone_access_points(
        self,
        zone_id: str,
        limit: int | None,
        offset: int | None,
        sort: str | None,
    ) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    async def get_cause_codes(
        self,
        limit: int | None,
        sort: str | None,
    ) -> list[dict[str, Any]]:
        raise NotImplementedError

    @abstractmethod
    async def get_anomalies(
        self,
        severity: str | None,
        zone_id: str | None,
        limit: int | None,
        sort: str | None,
    ) -> list[dict[str, Any]]:
        raise NotImplementedError

    @abstractmethod
    async def get_clients(
        self,
        zone_id: str | None,
        ap_id: str | None,
        limit: int | None,
        offset: int | None,
        sort: str | None,
    ) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    async def get_hosts(
        self,
        limit: int | None,
        sort: str | None,
    ) -> list[dict[str, Any]]:
        raise NotImplementedError

    @abstractmethod
    async def get_os_distribution(self) -> list[dict[str, Any]]:
        raise NotImplementedError

    @abstractmethod
    async def get_load(
        self,
        hours: int | None,
        zone_id: str | None,
    ) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    async def get_time_series(
        self,
        metric: str,
        zone_ids: list[str] | None,
        start_time: str | None,
        end_time: str | None,
        interval: int | None,
    ) -> list[dict[str, Any]]:
        raise NotImplementedError
