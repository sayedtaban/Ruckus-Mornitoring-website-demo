from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_metrics_service
from app.schemas.host_usage import HostUsage
from app.services.metrics_service import WiFiMetricsService

router = APIRouter(tags=["Hosts"])


@router.get("/hosts", response_model=list[HostUsage])
async def get_host_usage(
    limit: int | None = Query(default=None, ge=1, description="Number of top hosts to return."),
    sort: str | None = Query(
        default="desc",
        pattern="^(asc|desc)$",
        description='Sort order for data usage. Default is "desc".',
    ),
    service: WiFiMetricsService = Depends(get_metrics_service),
) -> list[HostUsage]:
    try:
        return await service.get_hosts(limit=limit, sort=sort)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching host usage data: {str(e)}",
        )


