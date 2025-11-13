from __future__ import annotations

from pydantic import BaseModel, Field

from .common import Pagination


class Client(BaseModel):
    hostname: str | None = None
    modelName: str | None = None
    ipAddress: str | None = None
    macAddress: str
    wlan: str | None = None
    apName: str | None = None
    apMac: str | None = None
    dataUsage: float = Field(..., ge=0)
    os: str | None = None
    deviceType: str | None = None
    timestamp: str | None = None
    zoneId: str | None = None


class ClientListResponse(BaseModel):
    data: list[Client]
    pagination: Pagination

