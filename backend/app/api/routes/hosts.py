from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_metrics_service
from app.schemas.host_usage import HostUsage
from app.services.metrics_service import WiFiMetricsService

logger = logging.getLogger(__name__)
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
        result = await service.get_hosts(limit=limit, sort=sort)
        return result
    except ValueError as e:
        logger.error(f"Validation error in get_host_usage: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid request parameters: {str(e)}",
        )
    except Exception as e:
        logger.error(f"Error fetching host usage data: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching host usage data: {str(e)}",
        )


