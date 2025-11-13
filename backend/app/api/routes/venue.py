from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_metrics_service
from app.schemas.venue import VenueResponse
from app.services.metrics_service import WiFiMetricsService

router = APIRouter(tags=["Venue"])


@router.get("/venue", response_model=VenueResponse)
async def get_venue_metrics(
    service: WiFiMetricsService = Depends(get_metrics_service),
) -> VenueResponse:
    return await service.get_venue()

