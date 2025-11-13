from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_metrics_service
from app.schemas.os_distribution import OsDistribution
from app.services.metrics_service import WiFiMetricsService

router = APIRouter(tags=["OS Distribution"])


@router.get("/os-distribution", response_model=list[OsDistribution])
async def get_os_distribution(
    service: WiFiMetricsService = Depends(get_metrics_service),
) -> list[OsDistribution]:
    return await service.get_os_distribution()

