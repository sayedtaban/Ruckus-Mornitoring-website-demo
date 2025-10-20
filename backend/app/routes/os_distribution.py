"""OS distribution routes."""
from fastapi import APIRouter, HTTPException
from app.models.os_distribution import OSDistribution
from app.database.influx_client import influx_service
from app.config import settings

router = APIRouter(prefix="/os-distribution", tags=["os-distribution"])


@router.get("", response_model=list[OSDistribution])
async def get_os_distribution():
    """
    Get operating system distribution percentages.
    
    Returns percentage breakdown of connected clients by operating system.
    """
    try:
        query = (
            f"from(bucket: \"{settings.influxdb_bucket}\")\n"
            "  |> range(start: -2h)\n"
            "  |> filter(fn: (r) => r[\"_measurement\"] == \"client_metrics\")\n"
            "  |> group(columns: [\"macAddress\"])\n"
            "  |> last()\n"
        )
        rows = influx_service.query_dicts(query)
        counts: dict[str, int] = {}
        for r in rows:
            os_name = str(r.get("os") or "Unknown")
            counts[os_name] = counts.get(os_name, 0) + 1
        total = sum(counts.values()) or 1
        color_map = {
            "iOS": "#8B5CF6",
            "Android": "#3B82F6",
            "Unknown": "#1E3A5F",
            "Chrome OS/Chromebook": "#10B981",
            "macOS": "#D1D5DB",
            "Windows": "#6B7280",
        }
        items: list[OSDistribution] = []
        for os_name, count in counts.items():
            items.append(OSDistribution(
                os=os_name,
                percentage=float(f"{(count / total) * 100:.2f}"),
                color=color_map.get(os_name, "#999999"),
            ))
        items.sort(key=lambda x: x.percentage, reverse=True)
        return items

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

