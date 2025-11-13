from __future__ import annotations

from pydantic import BaseModel, Field

from .common import Pagination


class RadioDetail(BaseModel):
    band: str
    channel: int | None = None
    txPower: int | None = None
    noiseFloor: int | None = None
    clientCount: int | None = Field(None, ge=0)


class AccessPoint(BaseModel):
    mac: str
    name: str
    model: str | None = None
    status: str
    ip: str | None = None
    zoneId: str | None = None
    zoneName: str | None = None
    firmwareVersion: str | None = None
    serialNumber: str | None = None
    clientCount: int | None = Field(None, ge=0)
    channelUtilization: int | None = Field(None, ge=0)
    airtimeUtilization: int | None = Field(None, ge=0)
    cpuUtilization: int | None = Field(None, ge=0)
    memoryUtilization: int | None = Field(None, ge=0)
    radios: list[RadioDetail] | None = None


class AccessPointListResponse(BaseModel):
    total: int = Field(..., ge=0)
    list: list[AccessPoint]
    pagination: Pagination | None = None

