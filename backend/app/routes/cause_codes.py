"""Cause code routes."""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.models.cause_code import CauseCode
from app.database.influx_client import influx_service
from app.config import settings

router = APIRouter(prefix="/cause-codes", tags=["cause-codes"])


@router.get("", response_model=list[CauseCode])
async def get_cause_codes(
    limit: Optional[int] = Query(None, description="Number of results to return"),
    sort: Optional[str] = Query("count", description='Sort by "count" or "impactScore"')
):
    """
    Get 802.11 disconnect cause codes with counts and impact scores.
    
    Returns disconnect cause codes sorted by count or impact score.
    """
    try:
        query = (
            f"from(bucket: \"{settings.influxdb_bucket}\")\n"
            "  |> range(start: -48h)\n"
            "  |> filter(fn: (r) => r[\"_measurement\"] == \"disconnect_codes\")\n"
            "  |> group(columns: [\"code\"])\n"
            "  |> last()\n"
        )
        rows = influx_service.query_dicts(query)
        by_code: dict[int, dict] = {}
        for r in rows:
            code = int(r.get("code") or 0)
            if code not in by_code:
                by_code[code] = {"code": code, "description": None, "count": 0, "impactScore": 0.0}
            field_name = r.get("_field")
            if field_name == "description":
                by_code[code]["description"] = str(r.get("_value"))
            elif field_name in ("count", "impactScore"):
                by_code[code][field_name] = r.get("_value")

        items = [
            CauseCode(
                code=v["code"],
                description=str(v.get("description") or ""),
                count=int(v.get("count", 0)),
                impactScore=float(v.get("impactScore", 0.0)),
            )
            for v in by_code.values()
        ]
        reverse = True
        key_fn = (lambda x: x.count) if sort == "count" else (lambda x: x.impactScore)
        items.sort(key=key_fn, reverse=reverse)
        if limit is not None:
            items = items[:limit]
        return items

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


