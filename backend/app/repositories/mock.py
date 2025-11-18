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

    async def get_cause_codes(self, limit: int | None, sort: str | None, zone_id: str | None = None) -> list[dict[str, Any]]:
        print(f"[MockRepository] get_cause_codes called with limit={limit}, sort={sort}, zone_id={zone_id}")
        data = list(self._cause_codes)
        print(f"[MockRepository] Original cause codes count: {len(data)}")
        if data:
            print(f"[MockRepository] Original first cause code: code={data[0].get('code')}, count={data[0].get('count')}")
        
        # If zone_id is provided, scale cause codes based on zone's AP count
        if zone_id:
            print(f"[MockRepository] Filtering by zone_id: {zone_id}")
            # Get total APs across all zones
            total_aps = self._venue.get("totalAPs", 1)
            print(f"[MockRepository] Total APs: {total_aps}")
            
            # Get APs for the specific zone
            zone_aps = 0
            for zone in self._venue.get("zones", []):
                if zone.get("id") == zone_id:
                    zone_aps = zone.get("totalAPs", 0)
                    print(f"[MockRepository] Found zone {zone_id} with {zone_aps} APs")
                    break
            
            # Scale cause code counts proportionally based on zone's AP count
            if total_aps > 0 and zone_aps > 0:
                scale_factor = zone_aps / total_aps
                print(f"[MockRepository] Scale factor: {scale_factor} ({zone_aps}/{total_aps})")
                data = [
                    {
                        **item,
                        "count": max(0, int(item.get("count", 0) * scale_factor)),
                        "impactScore": item.get("impactScore", 0) * scale_factor
                    }
                    for item in data
                ]
                print(f"[MockRepository] Scaled first cause code: code={data[0].get('code')}, count={data[0].get('count')}")
            else:
                print(f"[MockRepository] Zone has no APs or invalid data, returning zero counts")
                # If zone has no APs, return empty counts
                data = [
                    {
                        **item,
                        "count": 0,
                        "impactScore": 0
                    }
                    for item in data
                ]
        else:
            print(f"[MockRepository] No zone_id provided, returning all cause codes")
        
        if sort in {"count", "impactScore"}:
            data.sort(key=lambda item: item.get(sort, 0), reverse=True)
            print(f"[MockRepository] Sorted by {sort}")
        
        result = data[:limit] if limit else data
        print(f"[MockRepository] Returning {len(result)} cause codes")
        if result:
            print(f"[MockRepository] First result: code={result[0].get('code')}, count={result[0].get('count')}")
        return result

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

