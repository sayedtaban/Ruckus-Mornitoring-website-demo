from __future__ import annotations

from pydantic import BaseModel, Field


class LoadDataPoint(BaseModel):
    timestamp: str
    band24G: float = Field(..., ge=0)
    band5G: float = Field(..., ge=0)
    band6G5G: float = Field(..., ge=0)


class FrequencyBandLoad(BaseModel):
    band: str
    color: str | None = None
    data: list[LoadDataPoint]


class LoadResponse(BaseModel):
    bands: list[FrequencyBandLoad]

