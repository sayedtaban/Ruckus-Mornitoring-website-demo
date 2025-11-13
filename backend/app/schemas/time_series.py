from __future__ import annotations

from pydantic import BaseModel


class TimeSeriesPoint(BaseModel):
    timestamp: str
    value: float
    zone: str


