"""Host usage routes."""
from fastapi import APIRouter, Query, HTTPException
from app.models.host_usage import HostUsage
from app.database.influx_client import influx_service
from app.config import settings

router = APIRouter(prefix="/hosts", tags=["hosts"])


@router.get("", response_model=list[HostUsage])
async def get_hosts(
    limit: int = Query(10, description="Number of top hosts to return"),
    sort: str = Query("desc", description='Sort order "desc" | "asc"')
):
    """
    Get host data usage statistics.
    
    Returns top hosts by data usage, sorted in descending or ascending order.
    """
    try:
        query = (
            f"from(bucket: \"{settings.influxdb_bucket}\")\n"
            "  |> range(start: -24h)\n"
            "  |> filter(fn: (r) => r[\"_measurement\"] == \"host_usage\")\n"
            "  |> group(columns: [\"hostname\"])\n"
            "  |> last()\n"
        )
        rows = influx_service.query_dicts(query)
        by_host: dict[str, float] = {}
        for r in rows:
            if r.get("_field") == "dataUsage":
                by_host[str(r.get("hostname"))] = float(r.get("_value") or 0.0)

        items = [HostUsage(hostname=k, dataUsage=v) for k, v in by_host.items()]
        reverse = sort == "desc"
        items.sort(key=lambda x: x.dataUsage, reverse=reverse)
        return items[: limit]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


