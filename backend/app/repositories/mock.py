from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from .base import WiFiMetricsRepository


def _load_json(file_path: Path) -> Any:
    with file_path.open(encoding="utf-8") as file:
        return json.load(file)


@lru_cache
def _data_dir() -> Path:
    return Path(__file__).resolve().parents[2] / "api-samples"


class MockWiFiMetricsRepository(WiFiMetricsRepository):
    """Repository that serves data from API sample JSON files."""

    def __init__(self) -> None:
        data_path = _data_dir()
        self._venue = _load_json(data_path / "venue-data.json")
        self._ap = _load_json(data_path / "ap-data.json")
        self._cause_codes = _load_json(data_path / "cause-code-data.json")
        self._anomalies = _load_json(data_path / "anomalies-data.json")
        self._clients = _load_json(data_path / "clients-data.json")
        self._hosts = _load_json(data_path / "host-usage-data.json")
        self._os_distribution = _load_json(data_path / "os-distribution-data.json")
        self._load_data = _load_json(data_path / "load-data.json")
        self._time_series = _load_json(data_path / "time-series-data.json")
        self._zone_id_to_name = {zone["id"]: zone["name"] for zone in self._venue.get("zones", [])}

    async def get_venue(self) -> dict[str, Any]:
        venue = dict(self._venue)
        zones = []
        for zone in venue.get("zones", []):
            zone_copy = dict(zone)
            zone_copy.setdefault("domainName", zone_copy.get("name"))
            zones.append(zone_copy)
        venue["zones"] = zones
        return venue

    async def get_zone_access_points(
        self,
        zone_id: str,
        limit: int | None,
        offset: int | None,
        sort: str | None,
    ) -> dict[str, Any]:
        aps = [ap for ap in self._ap["list"] if ap.get("zoneId") == zone_id]

        sort_key = (sort or "clients").lower()
        key_fn = {
            "name": lambda item: (item.get("name") or "").lower(),
            "channelutilization": lambda item: item.get("channelUtilization", 0),
            "airtimeutilization": lambda item: item.get("airtimeUtilization", 0),
            "cpuutilization": lambda item: item.get("cpuUtilization", 0),
            "memoryutilization": lambda item: item.get("memoryUtilization", 0),
        }.get(sort_key, lambda item: item.get("clientCount", 0))

        reverse = sort_key != "name"
        aps.sort(key=key_fn, reverse=reverse)

        total = len(aps)
        page_offset = max(offset or 0, 0)
        page_limit = limit if limit and limit > 0 else total
        paged = aps[page_offset : page_offset + page_limit] if total else []

        return {
            "total": total,
            "list": paged,
            "pagination": {
                "total": total,
                "limit": page_limit,
                "offset": page_offset,
                "hasMore": page_offset + page_limit < total,
            },
        }

    async def get_cause_codes(self, limit: int | None, sort: str | None) -> list[dict[str, Any]]:
        data = list(self._cause_codes)
        if sort in {"count", "impactScore"}:
            data.sort(key=lambda item: item.get(sort, 0), reverse=True)
        return data[:limit] if limit else data

    async def get_anomalies(
        self,
        severity: str | None,
        zone_id: str | None,
        limit: int | None,
        sort: str | None,
    ) -> list[dict[str, Any]]:
        data = list(self._anomalies)
        if severity:
            data = [item for item in data if item.get("severity") == severity]
        if zone_id:
            zone_name = self._zone_id_to_name.get(zone_id, zone_id)
            data = [
                item
                for item in data
                if item.get("zoneId") == zone_id
                or item.get("affectedZoneId") == zone_id
                or item.get("affectedZone") == zone_name
            ]

        if sort == "severity":
            severity_order = {"critical": 4, "major": 3, "warning": 2, "info": 1}
            data.sort(key=lambda item: severity_order.get(item.get("severity", "info"), 0), reverse=True)
        else:
            data.sort(key=lambda item: item.get("timestamp", ""), reverse=True)

        return data[:limit] if limit else data

    async def get_clients(
        self,
        zone_id: str | None,
        ap_id: str | None,
        limit: int | None,
        offset: int | None,
        sort: str | None,
    ) -> dict[str, Any]:
        data = list(self._clients)
        if zone_id:
            data = [item for item in data if item.get("zoneId") == zone_id]
        if ap_id:
            data = [item for item in data if item.get("apMac") == ap_id or item.get("apId") == ap_id]

        sort_key = {
            "dataUsage": lambda item: item.get("dataUsage", 0),
            "hostname": lambda item: item.get("hostname", ""),
            "timestamp": lambda item: item.get("timestamp", ""),
        }.get(sort or "dataUsage", lambda item: item.get("dataUsage", 0))

        data.sort(key=sort_key, reverse=(sort or "dataUsage") != "hostname")

        total = len(data)
        if offset:
            data = data[offset:]
        if limit:
            data = data[:limit]

        return {
            "data": data,
            "pagination": {
                "total": total,
                "limit": limit or total,
                "offset": offset or 0,
                "hasMore": (offset or 0) + (limit or total) < total,
            },
        }

    async def get_hosts(self, limit: int | None, sort: str | None) -> list[dict[str, Any]]:
        data = list(self._hosts)
        reverse = (sort or "desc") != "asc"
        data.sort(key=lambda item: item.get("dataUsage", 0), reverse=reverse)
        return data[:limit] if limit else data

    async def get_os_distribution(self) -> list[dict[str, Any]]:
        return self._os_distribution

    async def get_load(self, hours: int | None, zone_id: str | None) -> dict[str, Any]:
        # Mock data does not include hours filtering; simply return available data
        return self._load_data

    async def get_time_series(
        self,
        metric: str,
        zone_ids: list[str] | None,
        start_time: str | None,
        end_time: str | None,
        interval: int | None,
    ) -> list[dict[str, Any]]:
        # Mock data is a list of time-series points; apply basic filtering
        data = list(self._time_series)
        if zone_ids:
            zone_names = {self._zone_id_to_name.get(zone_id, zone_id) for zone_id in zone_ids}
            data = [item for item in data if item.get("zone") in zone_names]
        if start_time:
            data = [item for item in data if item.get("timestamp") >= start_time]
        if end_time:
            data = [item for item in data if item.get("timestamp") <= end_time]
        return data

