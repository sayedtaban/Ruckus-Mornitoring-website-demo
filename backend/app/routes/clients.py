"""Client/device routes."""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.models.client import ClientResponse, Client
from app.database.influx_client import influx_service
from app.config import settings

router = APIRouter(prefix="/clients", tags=["clients"])


@router.get("", response_model=ClientResponse)
async def get_clients(
    zoneId: Optional[str] = Query(None, description="Filter by zone ID"),
    apId: Optional[str] = Query(None, description="Filter by access point ID"),
    limit: int = Query(100, description="Number of results"),
    offset: int = Query(0, description="Pagination offset"),
    sort: str = Query("dataUsage", description='Sort by "dataUsage" | "hostname" | "timestamp"')
):
    """
    Get list of connected clients/devices.
    
    Returns clients filtered by zone and/or AP, sorted by data usage, hostname, or timestamp.
    """
    try:
        filters = []
        if zoneId:
            filters.append(f'r["zoneId"] == "{zoneId}"')
        if apId:
            filters.append(f'r["apMac"] == "{apId}"')
        filter_str = " and ".join(filters) if filters else "true"
        query = (
            f"from(bucket: \"{settings.influxdb_bucket}\")\n"
            "  |> range(start: -2h)\n"
            "  |> filter(fn: (r) => r[\"_measurement\"] == \"client_metrics\")\n"
            f"  |> filter(fn: (r) => {filter_str})\n"
            "  |> group(columns: [\"macAddress\"])\n"
            "  |> last()\n"
        )
        rows = influx_service.query_dicts(query)
        items: list[Client] = []
        index: dict[str, dict] = {}
        for r in rows:
            mac = r.get("macAddress")
            if mac not in index:
                index[mac] = {
                    "hostname": None,
                    "modelName": None,
                    "ipAddress": None,
                    "macAddress": mac,
                    "wlan": r.get("wlan"),
                    "apName": r.get("apName"),
                    "apMac": r.get("apMac"),
                    "dataUsage": 0.0,
                    "os": r.get("os"),
                    "deviceType": r.get("deviceType"),
                }
            field_name = r.get("_field")
            index[mac][field_name] = r.get("_value")

        for v in index.values():
            items.append(Client(
                hostname=str(v.get("hostname", "")),
                modelName=str(v.get("modelName", "Unknown")),
                ipAddress=str(v.get("ipAddress", "")),
                macAddress=str(v.get("macAddress", "")),
                wlan=str(v.get("wlan", "")),
                apName=str(v.get("apName", "")),
                apMac=str(v.get("apMac", "")),
                dataUsage=float(v.get("dataUsage", 0.0)),
                os=str(v.get("os", "Unknown")),
                deviceType=str(v.get("deviceType", "other")),
            ))

        if sort == "hostname":
            items.sort(key=lambda x: x.hostname.lower())
        elif sort == "timestamp":
            pass
        else:
            items.sort(key=lambda x: x.dataUsage, reverse=True)

        total = len(items)
        page = items[offset: offset + limit]
        return ClientResponse(
            data=page,
            pagination={
                "total": total,
                "limit": limit,
                "offset": offset,
                "hasMore": (offset + limit) < total,
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


