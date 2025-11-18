from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_metrics_service
from app.schemas.cause_code import CauseCode
from app.services.metrics_service import WiFiMetricsService

router = APIRouter(tags=["Cause Codes"])


@router.get("/cause-codes", response_model=list[CauseCode])
async def get_cause_codes(
    limit: int | None = Query(default=None, ge=1, description="Maximum number of results to return"),
    sort: str | None = Query(default=None, pattern="^(count|impactScore)$", description='Sort field: "count" or "impactScore"'),
    zoneId: str | None = Query(default=None, description="Filter cause codes by zone ID"),
    service: WiFiMetricsService = Depends(get_metrics_service),
) -> list[CauseCode]:
    print(f"[Backend Route] get_cause_codes called with limit={limit}, sort={sort}, zoneId={zoneId}")
    result = await service.get_cause_codes(limit=limit, sort=sort, zone_id=zoneId)
    print(f"[Backend Route] Returning {len(result)} cause codes")
    if result:
        print(f"[Backend Route] First cause code: code={result[0].code}, count={result[0].count}, impactScore={result[0].impactScore}")
        print(f"[Backend Route] All cause codes: {[(c.code, c.count) for c in result[:5]]}")
    else:
        print(f"[Backend Route] No cause codes returned!")
    return result

