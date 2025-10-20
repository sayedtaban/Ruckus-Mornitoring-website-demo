"""Time series routes."""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from datetime import datetime
from app.models.time_series import TimeSeriesPoint
from app.database.influx_client import influx_service
from app.config import settings

router = APIRouter(prefix="/time-series", tags=["time-series"])


@router.get("", response_model=list[TimeSeriesPoint])
async def get_time_series(
    metric: str = Query(..., description='Metric type: "experienceScore" | "utilization" | "netflixScore"'),
    zoneIds: Optional[str] = Query(None, description="Comma-separated zone IDs"),
    startTime: Optional[datetime] = Query(None, description="Start timestamp (ISO 8601)"),
    endTime: Optional[datetime] = Query(None, description="End timestamp (ISO 8601)"),
    interval: int = Query(1, description="Data point interval in minutes")
):
    """
    Get time-series data for metrics.
    
    Returns time-series data for the specified metric, filtered by zones and time range.
    """
    try:
        filters = [f'r["metric"] == "{metric}"']
        if zoneIds:
            zone_list = [z.strip() for z in zoneIds.split(",") if z.strip()]
            if zone_list:
                filters.append(f'r["zoneId"] =~ /{"|".join(zone_list)}/')
        filter_str = " and ".join(filters)
        start = startTime.isoformat() if startTime else f"-{max(1, interval)}h"
        stop = endTime.isoformat() if endTime else "now()"
        query = (
            f"from(bucket: \"{settings.influxdb_bucket}\")\n"
            f"  |> range(start: {start}, stop: {stop})\n"
            "  |> filter(fn: (r) => r[\\\"_measurement\\\"] == \\\"metrics\\\")\n"
            f"  |> filter(fn: (r) => {filter_str})\n"
            f"  |> aggregateWindow(every: {interval}m, fn: mean, createEmpty: false)\n"
        )
        rows = influx_service.query_dicts(query)
        items: list[TimeSeriesPoint] = []
        for r in rows:
            if r.get("_field") != "value":
                continue
            items.append(TimeSeriesPoint(
                timestamp=r.get("_time"),
                value=float(r.get("_value") or 0.0),
                zone=str(r.get("zoneName") or r.get("zoneId") or ""),
            ))
        items.sort(key=lambda x: x.timestamp)
        return items

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

