from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_metrics_service
from app.schemas.anomaly import Anomaly
from app.services.metrics_service import WiFiMetricsService

router = APIRouter(tags=["Anomalies"])


@router.get("/anomalies", response_model=list[Anomaly])
async def get_anomalies(
    severity: str | None = Query(
        default=None,
        pattern="^(critical|major|warning|info)$",
        description="Filter anomalies by severity.",
    ),
    zone_id: str | None = Query(default=None, alias="zoneId", description="Filter by zone identifier."),
    limit: int | None = Query(default=None, ge=1, description="Maximum number of anomalies to return."),
    sort: str | None = Query(
        default=None,
        pattern="^(timestamp|severity)$",
        description='Sort order: "timestamp" (default) or "severity".',
    ),
    service: WiFiMetricsService = Depends(get_metrics_service),
) -> list[Anomaly]:
    try:
        return await service.get_anomalies(
            severity=severity,
            zone_id=zone_id,
            limit=limit,
            sort=sort,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching anomalies: {str(e)}",
        )

