"""Anomaly routes."""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.models.anomaly import Anomaly
from app.database.influx_client import influx_service
from app.config import settings

router = APIRouter(prefix="/anomalies", tags=["anomalies"])


@router.get("", response_model=list[Anomaly])
async def get_anomalies(
    severity: Optional[str] = Query(None, description='Filter by severity ("critical" | "major" | "warning" | "info")'),
    zoneId: Optional[str] = Query(None, description="Filter by zone ID"),
    limit: int = Query(50, description="Number of results"),
    sort: str = Query("timestamp", description='Sort order "timestamp" | "severity"')
):
    """
    Get detected network anomalies.
    
    Returns anomalies filtered by severity and/or zone, sorted by timestamp or severity.
    """
    try:
        filters = []
        if severity:
            filters.append(f'r["severity"] == "{severity}"')
        if zoneId:
            filters.append(f'r["zoneId"] == "{zoneId}"')
        filter_str = " and ".join(filters) if filters else "true"
        query = (
            f"from(bucket: \"{settings.influxdb_bucket}\")\n"
            "  |> range(start: -7d)\n"
            "  |> filter(fn: (r) => r[\"_measurement\"] == \"anomalies\")\n"
            f"  |> filter(fn: (r) => {filter_str})\n"
            "  |> group(columns: [\"anomalyId\"])\n"
            "  |> last()\n"
        )
        rows = influx_service.query_dicts(query)
        items: list[Anomaly] = []
        tmp: dict[str, dict] = {}
        for r in rows:
            aid = str(r.get("anomalyId"))
            if aid not in tmp:
                tmp[aid] = {
                    "id": aid,
                    "timestamp": r.get("_time"),
                    "type": r.get("type"),
                    "severity": r.get("severity"),
                    "affectedZone": r.get("affectedZone"),
                }
            field_name = r.get("_field")
            if field_name in ("description", "metric", "value"):
                tmp[aid][field_name] = r.get("_value")
        for v in tmp.values():
            items.append(Anomaly(
                id=v["id"],
                timestamp=v["timestamp"],
                type=str(v.get("type")),
                severity=str(v.get("severity")),
                description=str(v.get("description", "")),
                affectedZone=str(v.get("affectedZone", "")),
                metric=str(v.get("metric", "")),
            ))
        if sort == "severity":
            order = {"critical": 0, "major": 1, "warning": 2, "info": 3}
            items.sort(key=lambda x: order.get(x.severity, 9))
        else:
            items.sort(key=lambda x: x.timestamp, reverse=True)
        return items[: limit]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

