from __future__ import annotations

from datetime import datetime
from typing import Any, Iterable, Optional

from app.repositories.base import WiFiMetricsRepository

from .client import AsyncQueryClient
from .converters import classify_device, tables_to_records, to_float, to_int
from .queries import build_filter_clause, build_pivot_query, build_raw_query

SUPPORTED_TIME_SERIES_METRICS = {
    "experienceScore",
    "utilization",
    "netflixScore",
    "clients",
}


def _extract_client_ip(record: dict[str, Any]) -> str:
    candidates = [
        record.get("clientIpv4"),
        record.get("clientIp4"),
        record.get("clientIPv4"),
        record.get("clientIp"),
        record.get("ipAddress"),
        record.get("ipv4Address"),
        record.get("ip4"),
    ]
    for candidate in candidates:
        if not candidate:
            continue
        ip_value = str(candidate).strip()
        if not ip_value or ip_value.lower() in {"null", "none"}:
            continue
        if "/" in ip_value:
            ip_value = ip_value.split("/", 1)[0]
        if " " in ip_value:
            ip_value = ip_value.split(" ", 1)[0]
        return ip_value
    return "N/A"


class InfluxWiFiMetricsRepository(WiFiMetricsRepository):
    """Repository that reads WiFi metrics from an InfluxDB bucket."""

    def __init__(
        self,
        *,
        url: str,
        token: str,
        org: str,
        bucket: str,
        client: Optional[Any] = None,
    ) -> None:
        self._bucket = bucket
        self._client = AsyncQueryClient(
            url=url,
            token=token,
            org=org,
            client=client,
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _pivot_query(
        self,
        measurement: str,
        *,
        range_: str = "-1h",
        filters: Iterable[str] | None = None,
        row_keys: Iterable[str] | None = None,
    ) -> list[dict[str, Any]]:
        flux = build_pivot_query(
            self._bucket,
            measurement,
            range_=range_,
            filters=filters,
            row_keys=row_keys,
        )
        tables = await self._client.query(flux)
        return tables_to_records(tables)

    async def _raw_query(
        self,
        measurement: str,
        *,
        range_: str = "-24h",
        filters: Iterable[str] | None = None,
    ):
        flux = build_raw_query(
            self._bucket,
            measurement,
            range_=range_,
            filters=filters,
        )
        return await self._client.query(flux)

    # ------------------------------------------------------------------
    # Venue
    # ------------------------------------------------------------------

    async def get_venue(self) -> dict[str, Any]:
        zone_records = await self._pivot_query(
            "zone",
            row_keys=["_time", "zoneId", "zoneName"],
        )
        zones: list[dict[str, Any]] = []
        for record in zone_records:
            zone_id = str(record.get("zoneId") or record.get("zone_id") or "")
            zone_name = str(record.get("zoneName") or zone_id)
            domain_name = str(
                record.get("domainName") or record.get("domain") or zone_name
            )
            zones.append(
                {
                    "id": zone_id,
                    "name": zone_name,
                    "domainName": domain_name,
                    "totalAPs": to_int(record.get("totalAPs")),
                    "connectedAPs": to_int(record.get("connectedAPs")),
                    "disconnectedAPs": to_int(record.get("disconnectedAPs")),
                    "clients": to_int(record.get("clients")),
                    "apAvailability": to_float(record.get("apAvailability")),
                    "clientsPerAP": to_float(record.get("clientsPerAP")),
                    "experienceScore": to_float(record.get("experienceScore")),
                    "utilization": to_float(record.get("utilization")),
                    "rxDesense": to_float(record.get("rxDesense")),
                    "netflixScore": to_float(record.get("netflixScore")),
                }
            )

        venue_records = await self._pivot_query("venue")
        venue_data = venue_records[0] if venue_records else {}

        total_zones = len(zones)
        total_aps = sum(zone["totalAPs"] for zone in zones)
        total_clients = sum(zone["clients"] for zone in zones)

        if total_zones:
            experience_sum = sum(zone["experienceScore"] for zone in zones)
            avg_experience = experience_sum / total_zones
            sla_hits = sum(
                1 for zone in zones if zone["apAvailability"] >= 95
            )
            sla_compliance = sla_hits / total_zones * 100
        else:
            avg_experience = 0.0
            sla_compliance = 0.0

        return {
            "name": venue_data.get("venueName")
            or venue_data.get("name")
            or "WiFi Monitoring Venue",
            "totalZones": to_int(venue_data.get("totalZones"), total_zones),
            "totalAPs": to_int(venue_data.get("totalAPs"), total_aps),
            "totalClients": to_int(
                venue_data.get("totalClients"),
                total_clients,
            ),
            "avgExperienceScore": to_float(
                venue_data.get("avgExperienceScore"),
                avg_experience,
            ),
            "slaCompliance": to_float(
                venue_data.get("slaCompliance"),
                sla_compliance,
            ),
            "zones": zones,
        }

    # ------------------------------------------------------------------
    # Access points
    # ------------------------------------------------------------------

    async def get_zone_access_points(
        self,
        zone_id: str,
        limit: int | None,
        offset: int | None,
        sort: str | None,
    ) -> dict[str, Any]:
        zone_filter = f'|> filter(fn: (r) => r["zoneId"] == "{zone_id}")'
        records = await self._pivot_query(
            "access_point",
            filters=[zone_filter],
            row_keys=["_time", "apMac"],
        )

        ap_list: list[dict[str, Any]] = []
        for record in records:
            channel_24 = to_int(record.get("channel24G"))
            channel_5 = to_int(record.get("channel5G"))
            ap_list.append(
                {
                    "mac": record.get("apMac") or "",
                    "name": record.get("apName") or record.get("apMac") or "",
                    "model": record.get("model") or "Unknown",
                    "status": (record.get("status") or "unknown").lower(),
                    "ip": record.get("ipAddress") or "",
                    "zoneId": record.get("zoneId") or zone_id,
                    "zoneName": record.get("zoneName") or "",
                    "firmwareVersion": (
                        record.get("firmwareVersion") or "unknown"
                    ),
                    "serialNumber": (
                        record.get("serialNumber") or "unknown"
                    ),
                    "clientCount": to_int(record.get("clientCount")),
                    "channelUtilization": to_float(record.get("airtime5G")),
                    "airtimeUtilization": to_float(record.get("airtime24G")),
                    "cpuUtilization": to_float(record.get("cpuUtilization")),
                    "memoryUtilization": to_float(
                        record.get("memoryUtilization")
                    ),
                    "radios": [
                        {
                            "band": "2.4GHz",
                            "channel": channel_24,
                            "txPower": to_int(record.get("eirp24G")),
                            "noiseFloor": to_int(record.get("noise24G")),
                            "clientCount": to_int(
                                record.get("clientCount24G")
                            ),
                        },
                        {
                            "band": "5GHz",
                            "channel": channel_5,
                            "txPower": to_int(record.get("eirp5G")),
                            "noiseFloor": to_int(record.get("noise5G")),
                            "clientCount": to_int(
                                record.get("clientCount5G")
                            ),
                        },
                    ],
                }
            )

        sort_key = (sort or "clients").lower()
        key_fn = {
            "name": lambda item: (item.get("name") or "").lower(),
            "channelutilization": lambda item: item.get(
                "channelUtilization",
                0.0,
            ),
            "airtimeutilization": lambda item: item.get(
                "airtimeUtilization",
                0.0,
            ),
            "cpuutilization": lambda item: item.get(
                "cpuUtilization",
                0.0,
            ),
            "memoryutilization": lambda item: item.get(
                "memoryUtilization",
                0.0,
            ),
        }.get(sort_key, lambda item: item.get("clientCount", 0))

        reverse = sort_key != "name"
        ap_list.sort(key=key_fn, reverse=reverse)

        total = len(ap_list)
        page_offset = max(offset or 0, 0)
        default_limit = 50 if total > 50 else total or 50
        page_limit = limit if limit and limit > 0 else default_limit
        page_limit = min(page_limit, 500)

        start = min(page_offset, total)
        end = min(start + page_limit, total)
        paged = ap_list[start:end]

        return {
            "total": total,
            "list": paged,
            "pagination": {
                "total": total,
                "limit": page_limit,
                "offset": page_offset,
                "hasMore": end < total,
            },
        }

    # ------------------------------------------------------------------
    # Cause codes / anomalies
    # ------------------------------------------------------------------

    async def get_cause_codes(
        self,
        limit: int | None,
        sort: str | None,
        zone_id: str | None = None,
    ) -> list[dict[str, Any]]:
        # TODO: Implement zone_id filtering for InfluxDB
        # This would require filtering by APs that belong to the zone
        tables = await self._raw_query(
            "ap_disconnect_cause",
            range_="-24h",
        )

        # First pass: Find the most recent timestamp
        most_recent_time = None
        for table in tables:
            for record in table.records:
                record_time = record.values.get("_time")
                if record_time:
                    if (most_recent_time is None or
                            record_time > most_recent_time):
                        most_recent_time = record_time

        if most_recent_time is None:
            return []

        aggregates: dict[str, dict[str, Any]] = {}
        # Track unique APs per cause code for the most recent time
        # Count unique APs (not events) at the most recent timestamp
        seen_aps: dict[str, set[str]] = {}

        # Second pass: Count unique APs per cause code at most recent time
        for table in tables:
            for record in table.records:
                cause_tag = record.values.get("causeCode")
                if not cause_tag:
                    continue

                record_time = record.values.get("_time")
                # Only process records from the most recent time
                if record_time != most_recent_time:
                    continue

                cause_tag_str = str(cause_tag)
                # Get AP MAC address to count unique APs
                ap_mac = str(record.values.get("apMac", ""))

                # Initialize seen_aps for this cause code if needed
                if cause_tag_str not in seen_aps:
                    seen_aps[cause_tag_str] = set()

                entry = aggregates.setdefault(
                    cause_tag_str,
                    {
                        "code": (
                            int(cause_tag)
                            if str(cause_tag).isdigit()
                            else cause_tag
                        ),
                        "description": "",
                        "count": 0,
                        "impactScore": 0.0,
                    },
                )

                field = record.values.get("_field")
                value = record.get_value()

                # Count each unique AP only once per cause code
                if ap_mac and ap_mac not in seen_aps[cause_tag_str]:
                    seen_aps[cause_tag_str].add(ap_mac)
                    entry["count"] += 1

                # Update description and impactScore from any field
                if field == "causeDescription" and value:
                    entry["description"] = str(value)
                elif field == "impactScore":
                    score = to_float(value)
                    if score is not None:
                        # Use the latest impactScore value
                        entry["impactScore"] = score
                elif field == "causeCode" and str(value).isdigit():
                    entry["code"] = int(value)

        results = list(aggregates.values())
        if sort == "impactScore":
            results.sort(
                key=lambda item: item.get("impactScore", 0),
                reverse=True,
            )
        else:
            results.sort(
                key=lambda item: item.get("count", 0),
                reverse=True,
            )

        if limit:
            results = results[:limit]
        return results

    async def get_anomalies(
        self,
        severity: str | None,
        zone_id: str | None,
        limit: int | None,
        sort: str | None,
    ) -> list[dict[str, Any]]:
        venue = await self.get_venue()
        anomalies: list[dict[str, Any]] = []
        now = datetime.utcnow()

        for zone in venue["zones"]:
            if zone_id and zone["id"] != zone_id:
                continue

            if zone["experienceScore"] < 70:
                score_value = zone["experienceScore"]
                description = f"Experience score dropped to {score_value:.1f}"
                anomalies.append(
                    {
                        "id": f"{zone['id']}-experience",
                        "timestamp": now.isoformat() + "Z",
                        "type": "poor_experience",
                        "severity": "critical",
                        "description": description,
                        "affectedZone": zone["name"],
                        "metric": "experience_score",
                    }
                )

            if zone["utilization"] > 80:
                util_description = (
                    f"Channel utilization at {zone['utilization']:.1f}%"
                )
                util_severity = (
                    "major" if zone["utilization"] < 90 else "critical"
                )
                anomalies.append(
                    {
                        "id": f"{zone['id']}-utilization",
                        "timestamp": now.isoformat() + "Z",
                        "type": "high_utilization",
                        "severity": util_severity,
                        "description": util_description,
                        "affectedZone": zone["name"],
                        "metric": "utilization",
                    }
                )

            if zone["rxDesense"] > 10:
                rf_description = (
                    f"RxDesense elevated to {zone['rxDesense']:.1f}%"
                )
                anomalies.append(
                    {
                        "id": f"{zone['id']}-rxdesense",
                        "timestamp": now.isoformat() + "Z",
                        "type": "rf_interference",
                        "severity": "warning",
                        "description": rf_description,
                        "affectedZone": zone["name"],
                        "metric": "rx_desense",
                    }
                )

        if severity:
            anomalies = [a for a in anomalies if a["severity"] == severity]

        anomalies.sort(key=lambda item: item["timestamp"], reverse=True)
        if limit:
            anomalies = anomalies[:limit]

        return anomalies

    # ------------------------------------------------------------------
    # Clients / hosts / OS distribution
    # ------------------------------------------------------------------

    async def get_clients(
        self,
        zone_id: str | None,
        ap_id: str | None,
        limit: int | None,
        offset: int | None,
        sort: str | None,
    ) -> dict[str, Any]:
        filter_clauses: list[str] = [
            '|> filter(fn: (r) => r["_measurement"] == "client")'
        ]
        if zone_id:
            filter_clauses.append(
                f'|> filter(fn: (r) => r["zoneId"] == "{zone_id}")'
            )
        if ap_id:
            filter_clauses.append(
                (
                    f'|> filter(fn: (r) => r["apMac"] == "{ap_id}" or '
                    f'r["apId"] == "{ap_id}")'
                )
            )

        flux_limit = max(limit or 200, 200)
        flux = "\n  ".join(filter_clauses)
        query = f"""
from(bucket: "{self._bucket}")
  |> range(start: -1h)
  {flux}
  |> sort(columns: ["_time"], desc: true)
  |> limit(n: {flux_limit})
  |> filter(fn: (r) =>
      r["_field"] =~ /^(downlinkRate|rssi|rxBytes|snr|txBytes
        |txRxBytes|uplinkRate)$/
    )
  |> pivot(
      rowKey: ["clientMac", "_time"],
      columnKey: ["_field"],
      valueColumn: "_value",
    )
  |> group(columns: ["clientMac"])
  |> sort(columns: ["_time"], desc: true)
  |> limit(n: 1)
  |> group()
"""
        tables = await self._client.query(query)
        records = tables_to_records(tables)

        clients: list[dict[str, Any]] = []
        for record in records:
            os_type = record.get("osType") or "Unknown"
            bytes_total = to_float(record.get("txRxBytes"))
            data_usage = bytes_total / (1024 * 1024)
            clients.append(
                {
                    "hostname": (
                        record.get("clientHost")
                        or record.get("clientMac")
                        or "Unknown"
                    ),
                    "modelName": os_type,
                    "ipAddress": _extract_client_ip(record),
                    "macAddress": record.get("clientMac") or "",
                    "wlan": record.get("ssid") or "",
                    "apName": record.get("apName") or "",
                    "apMac": record.get("apMac") or "",
                    "dataUsage": round(data_usage, 2),
                    "os": os_type,
                    "deviceType": classify_device(os_type),
                }
            )

        if sort == "hostname":
            clients.sort(key=lambda item: item["hostname"])
        elif sort == "timestamp":
            clients.sort(
                key=lambda item: item.get("timestamp", ""),
                reverse=True,
            )
        else:
            clients.sort(key=lambda item: item["dataUsage"], reverse=True)

        total = len(clients)
        start = offset or 0
        end = start + limit if limit else total
        end = min(end, total)
        paged = clients[start:end]

        return {
            "data": paged,
            "pagination": {
                "total": total,
                "limit": limit or total,
                "offset": start,
                "hasMore": end < total,
            },
        }

    async def get_hosts(
        self,
        limit: int | None,
        sort: str | None,
    ) -> list[dict[str, Any]]:
        records = await self._pivot_query(
            "host_usage",
            row_keys=["_time", "hostname"],
        )

        hosts = [
            {
                "hostname": record.get("hostname") or "Unknown",
                "dataUsage": to_float(record.get("dataUsage")),
            }
            for record in records
        ]

        hosts.sort(key=lambda item: item["dataUsage"], reverse=True)
        if limit:
            hosts = hosts[:limit]
        return hosts

    async def get_os_distribution(self) -> list[dict[str, Any]]:
        records = await self._pivot_query(
            "os_distribution",
            row_keys=["_time", "os"],
        )

        distribution = [
            {
                "os": record.get("os") or "Unknown",
                "percentage": to_float(record.get("percentage")),
                "color": record.get("color") or "",
            }
            for record in records
        ]

        total_percentage = sum(item["percentage"] for item in distribution)
        if total_percentage > 0:
            for item in distribution:
                item["percentage"] = round(item["percentage"], 2)
        return distribution

    # ------------------------------------------------------------------
    # Load / time series
    # ------------------------------------------------------------------

    async def get_load(
        self,
        hours: int | None,
        zone_id: str | None,
    ) -> dict[str, Any]:
        range_hours = hours or 1
        filters = []
        if zone_id:
            filters.append(
                '|> filter(fn: (r) => r["zoneId"] == "{zone}")'.format(
                    zone=zone_id,
                )
            )

        fields_filter = (
            'fn: (r) => r["_field"] == "airtime24G" or '
            'r["_field"] == "airtime5G"'
        )
        filter_clause = build_filter_clause(filters)
        query = f"""
from(bucket: "{self._bucket}")
  |> range(start: -{range_hours}h)
  |> filter(fn: (r) => r["_measurement"] == "access_point")
  |> filter({fields_filter}){filter_clause}
  |> aggregateWindow(every: 5m, fn: mean, createEmpty: false)
  |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
"""
        tables = await self._client.query(query)
        records = tables_to_records(tables)

        band_data = {
            "2.4G": [],
            "5G": [],
            "6G/5G": [],
        }
        for record in records:
            timestamp = record.get("timestamp")
            band24 = to_float(record.get("airtime24G"))
            band5 = to_float(record.get("airtime5G"))
            band_data["2.4G"].append(
                {
                    "timestamp": timestamp,
                    "band24G": round(band24, 2),
                    "band5G": 0,
                    "band6G5G": 0,
                }
            )
            band_data["5G"].append(
                {
                    "timestamp": timestamp,
                    "band24G": 0,
                    "band5G": round(band5, 2),
                    "band6G5G": 0,
                }
            )
            band_data["6G/5G"].append(
                {
                    "timestamp": timestamp,
                    "band24G": 0,
                    "band5G": 0,
                    "band6G5G": 0.0,
                }
            )

        return {
            "bands": [
                {
                    "band": "2.4G",
                    "color": "#1E3A5F",
                    "data": band_data["2.4G"],
                },
                {
                    "band": "5G",
                    "color": "#10B981",
                    "data": band_data["5G"],
                },
                {
                    "band": "6G/5G",
                    "color": "#3B82F6",
                    "data": band_data["6G/5G"],
                },
            ]
        }

    async def get_time_series(
        self,
        metric: str,
        zone_ids: list[str] | None,
        start_time: str | None,
        end_time: str | None,
        interval: int | None,
    ) -> list[dict[str, Any]]:
        if metric not in SUPPORTED_TIME_SERIES_METRICS:
            raise ValueError(f"Unsupported metric: {metric}")

        if start_time and end_time:
            range_clause = (
                f'|> range(start: time(v: "{start_time}"), '
                f'stop: time(v: "{end_time}"))'
            )
        elif start_time:
            range_clause = f'|> range(start: time(v: "{start_time}"))'
        else:
            range_clause = "|> range(start: -24h)"

        filters = []
        if zone_ids:
            zone_filter = " or ".join(
                f'r["zoneId"] == "{zone}"' for zone in zone_ids
            )
            filters.append(f"|> filter(fn: (r) => {zone_filter})")

        every = f"{interval}m" if interval else "15m"
        filter_clause = build_filter_clause(filters)
        query = f"""
from(bucket: "{self._bucket}")
  {range_clause}
  |> filter(fn: (r) => r["_measurement"] == "zone")
  |> filter(fn: (r) => r["_field"] == "{metric}"){filter_clause}
  |> aggregateWindow(every: {every}, fn: mean, createEmpty: false)
"""
        tables = await self._client.query(query)

        series: list[dict[str, Any]] = []
        for table in tables:
            for record in table.records:
                zone_name = (
                    record.values.get("zoneName")
                    or record.values.get("zoneId")
                    or ""
                )
                timestamp_value = record.values.get("_time")
                timestamp = (
                    timestamp_value.isoformat()
                    if hasattr(timestamp_value, "isoformat")
                    else timestamp_value
                )
                series.append(
                    {
                        "timestamp": timestamp,
                        "value": to_float(record.get_value()),
                        "zone": zone_name,
                    }
                )

        series.sort(key=lambda item: (item["zone"], item["timestamp"]))
        return series
