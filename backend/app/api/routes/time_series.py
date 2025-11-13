from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_metrics_service
from app.schemas.time_series import TimeSeriesPoint
from app.services.metrics_service import WiFiMetricsService

router = APIRouter(tags=["Time Series"])


@router.get("/time-series", response_model=list[TimeSeriesPoint])
async def get_time_series(
    metric: Annotated[str, Query(pattern="^(experienceScore|utilization|netflixScore)$")] = "experienceScore",
    zone_ids: str | None = Query(
        default=None,
        alias="zoneIds",
        description="Comma-separated zone identifiers.",
    ),
    start_time: str | None = Query(default=None, alias="startTime", description="Start timestamp (ISO 8601)."),
    end_time: str | None = Query(default=None, alias="endTime", description="End timestamp (ISO 8601)."),
    interval: int | None = Query(default=None, alias="interval", ge=1, description="Aggregation interval in minutes."),
    service: WiFiMetricsService = Depends(get_metrics_service),
) -> list[TimeSeriesPoint]:
    zone_id_list = zone_ids.split(",") if zone_ids else None
    return await service.get_time_series(
        metric=metric,
        zone_ids=zone_id_list,
        start_time=start_time,
        end_time=end_time,
        interval=interval,
    )


