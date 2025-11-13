from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_metrics_service
from app.schemas.client import ClientListResponse
from app.services.metrics_service import WiFiMetricsService

router = APIRouter(tags=["Clients"])


@router.get("/clients", response_model=ClientListResponse)
async def get_clients(
    zone_id: str | None = Query(default=None, alias="zoneId", description="Filter clients by zone identifier."),
    ap_id: str | None = Query(default=None, alias="apId", description="Filter clients by access point identifier."),
    limit: int | None = Query(default=None, ge=1, description="Number of clients to return."),
    offset: int | None = Query(default=None, ge=0, description="Pagination offset."),
    sort: str | None = Query(
        default=None,
        pattern="^(dataUsage|hostname|timestamp)$",
        description='Sort clients by "dataUsage", "hostname", or "timestamp".',
    ),
    service: WiFiMetricsService = Depends(get_metrics_service),
) -> ClientListResponse:
    return await service.get_clients(
        zone_id=zone_id,
        ap_id=ap_id,
        limit=limit,
        offset=offset,
        sort=sort,
    )

