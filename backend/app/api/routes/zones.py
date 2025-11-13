from __future__ import annotations

from fastapi import APIRouter, Depends, Path, Query

from app.api.deps import get_metrics_service
from app.schemas.access_point import AccessPointListResponse
from app.services.metrics_service import WiFiMetricsService

router = APIRouter(prefix="/zones", tags=["Zones"])


@router.get("/{zone_id}/aps", response_model=AccessPointListResponse)
async def get_zone_access_points(
    zone_id: str = Path(..., description="Zone identifier"),
    limit: int | None = Query(
        None,
        ge=1,
        le=500,
        description="Maximum number of access points to return",
    ),
    offset: int | None = Query(
        None,
        ge=0,
        description="Number of access points to skip before collecting results",
    ),
    sort: str | None = Query(
        None,
        description="Sort key: clients, name, channelUtilization, airtimeUtilization, cpuUtilization, memoryUtilization",
    ),
    service: WiFiMetricsService = Depends(get_metrics_service),
) -> AccessPointListResponse:
    return await service.get_zone_access_points(
        zone_id=zone_id,
        limit=limit,
        offset=offset,
        sort=sort,
    )


