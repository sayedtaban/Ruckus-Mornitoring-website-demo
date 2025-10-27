"""Load/band utilization routes."""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.models.load import LoadResponse, BandData, LoadDataPoint
from app.database.influx_client import influx_service
from app.config import settings

router = APIRouter(prefix="/load", tags=["load"])


@router.get("", response_model=LoadResponse)
async def get_load(
    hours: int = Query(1, ge=1, le=24, description="Number of hours of data"),
    zoneId: Optional[str] = Query(None, description="Filter by zone ID")
):
    """
    Get frequency band load data over time.
    
    Returns load metrics for 2.4G, 5G, and 6G/5G bands over the specified time range.
    """
    try:
        filt = f'r["zoneId"] == "{zoneId}"' if zoneId else "true"
        query = (
            f"from(bucket: \"{settings.influxdb_bucket}\")\n"
            f"  |> range(start: -{hours}h)\n"
            "  |> filter(fn: (r) => r[\\\"_measurement\\\"] == \\\"band_load\\\")\n"
            f"  |> filter(fn: (r) => {filt})\n"
        )
        rows = influx_service.query_dicts(query)
        bands: dict[str, dict[str, list[dict]]] = {"2.4G": {}, "5G": {}, "6G/5G": {}}
        for r in rows:
            band = str(r.get("band"))
            ts = r.get("_time")
            field_name = r.get("_field")
            if band not in bands:
                bands[band] = {}
            if ts not in bands[band]:
                bands[band][ts] = {"timestamp": ts, "band24G": 0.0, "band5G": 0.0, "band6G5G": 0.0}
            bands[band][ts][field_name] = float(r.get("_value") or 0.0)

        band_items: list[BandData] = []
        color_map = {"2.4G": "#1E3A5F", "5G": "#10B981", "6G/5G": "#3B82F6"}
        for band, time_map in bands.items():
            points: list[LoadDataPoint] = []
            for ts in sorted(time_map.keys()):
                vals = time_map[ts]
                points.append(LoadDataPoint(
                    timestamp=vals["timestamp"],
                    band24G=float(vals.get("band24G", 0.0)),
                    band5G=float(vals.get("band5G", 0.0)),
                    band6G5G=float(vals.get("band6G5G", 0.0)),
                ))
            band_items.append(BandData(band=band, color=color_map.get(band, "#999999"), data=points))

        return LoadResponse(bands=band_items)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


