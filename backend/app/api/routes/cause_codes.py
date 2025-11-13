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
    service: WiFiMetricsService = Depends(get_metrics_service),
) -> list[CauseCode]:
    return await service.get_cause_codes(limit=limit, sort=sort)

