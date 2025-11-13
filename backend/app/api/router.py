from __future__ import annotations

from fastapi import APIRouter

from app.api.routes import (
    anomalies,
    auth,
    cause_codes,
    clients,
    hosts,
    load,
    os_distribution,
    time_series,
    venue,
    zones,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(venue.router)
api_router.include_router(zones.router)
api_router.include_router(cause_codes.router)
api_router.include_router(anomalies.router)
api_router.include_router(clients.router)
api_router.include_router(hosts.router)
api_router.include_router(os_distribution.router)
api_router.include_router(load.router)
api_router.include_router(time_series.router)

