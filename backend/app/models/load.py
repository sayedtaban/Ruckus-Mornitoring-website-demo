"""Load/band utilization models."""
from pydantic import BaseModel
from typing import List
from datetime import datetime


class LoadDataPoint(BaseModel):
    """Single data point for load metrics."""
    timestamp: datetime
    band24G: float
    band5G: float
    band6G5G: float


class BandData(BaseModel):
    """Band data for load metrics."""
    band: str  # "2.4G" | "5G" | "6G/5G"
    color: str
    data: List[LoadDataPoint]


class LoadResponse(BaseModel):
    """Response model for load endpoint."""
    bands: List[BandData]

