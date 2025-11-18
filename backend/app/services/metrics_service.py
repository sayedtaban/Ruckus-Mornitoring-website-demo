from __future__ import annotations

from typing import Any, Iterable

from app.repositories.base import WiFiMetricsRepository
from app.schemas.access_point import AccessPointListResponse
from app.schemas.anomaly import Anomaly
from app.schemas.cause_code import CauseCode
from app.schemas.client import ClientListResponse
from app.schemas.host_usage import HostUsage
from app.schemas.load import LoadResponse
from app.schemas.os_distribution import OsDistribution
from app.schemas.time_series import TimeSeriesPoint
from app.schemas.venue import VenueResponse


class WiFiMetricsService:
    """Service layer for fetching WiFi monitoring metrics."""

    def __init__(self, repository: WiFiMetricsRepository) -> None:
        self._repository = repository

    async def get_venue(self) -> VenueResponse:
        data = await self._repository.get_venue()
        return VenueResponse.model_validate(data)

    async def get_zone_access_points(
        self,
        zone_id: str,
        limit: int | None,
        offset: int | None,
        sort: str | None,
    ) -> AccessPointListResponse:
        data = await self._repository.get_zone_access_points(
            zone_id=zone_id,
            limit=limit,
            offset=offset,
            sort=sort,
        )
        return AccessPointListResponse.model_validate(data)

    async def get_cause_codes(self, limit: int | None, sort: str | None, zone_id: str | None = None) -> list[CauseCode]:
        data = await self._repository.get_cause_codes(limit=limit, sort=sort, zone_id=zone_id)
        return self._parse_collection(data, CauseCode)

    async def get_anomalies(
        self,
        severity: str | None,
        zone_id: str | None,
        limit: int | None,
        sort: str | None,
    ) -> list[Anomaly]:
        data = await self._repository.get_anomalies(
            severity=severity,
            zone_id=zone_id,
            limit=limit,
            sort=sort,
        )
        return self._parse_collection(data, Anomaly)

    async def get_clients(
        self,
        zone_id: str | None,
        ap_id: str | None,
        limit: int | None,
        offset: int | None,
        sort: str | None,
    ) -> ClientListResponse:
        data = await self._repository.get_clients(
            zone_id=zone_id,
            ap_id=ap_id,
            limit=limit,
            offset=offset,
            sort=sort,
        )
        return ClientListResponse.model_validate(data)

    async def get_hosts(self, limit: int | None, sort: str | None) -> list[HostUsage]:
        data = await self._repository.get_hosts(limit=limit, sort=sort)
        return self._parse_collection(data, HostUsage)

    async def get_os_distribution(self) -> list[OsDistribution]:
        data = await self._repository.get_os_distribution()
        return self._parse_collection(data, OsDistribution)

    async def get_load(self, hours: int | None, zone_id: str | None) -> LoadResponse:
        data = await self._repository.get_load(hours=hours, zone_id=zone_id)
        return LoadResponse.model_validate(data)

    async def get_time_series(
        self,
        metric: str,
        zone_ids: list[str] | None,
        start_time: str | None,
        end_time: str | None,
        interval: int | None,
    ) -> list[TimeSeriesPoint]:
        data = await self._repository.get_time_series(
            metric=metric,
            zone_ids=zone_ids,
            start_time=start_time,
            end_time=end_time,
            interval=interval,
        )
        return self._parse_collection(data, TimeSeriesPoint)

    @staticmethod
    def _parse_collection(data: Iterable[Any], model: type[Any]) -> list[Any]:
        """Parse a collection of data items into model instances, skipping invalid items"""
        result = []
        for item in data:
            try:
                result.append(model.model_validate(item))
            except Exception as e:
                # Log validation errors but continue processing other items
                # This prevents one bad item from breaking the entire response
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Failed to validate item {item}: {e}")
                continue
        return result

