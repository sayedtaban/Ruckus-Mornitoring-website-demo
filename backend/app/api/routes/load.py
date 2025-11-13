from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_metrics_service
from app.schemas.load import LoadResponse
from app.services.metrics_service import WiFiMetricsService

router = APIRouter(tags=["Load"])


@router.get("/load", response_model=LoadResponse)
async def get_load(
    hours: int | None = Query(default=None, ge=1, le=24, description="Number of hours to include (max 24)."),
    zone_id: str | None = Query(default=None, alias="zoneId", description="Filter load data to a specific zone."),
    service: WiFiMetricsService = Depends(get_metrics_service),
) -> LoadResponse:
    return await service.get_load(hours=hours, zone_id=zone_id)


