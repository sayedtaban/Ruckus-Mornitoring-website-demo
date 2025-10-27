"""Time series models."""
from pydantic import BaseModel
from typing import List
from datetime import datetime


class TimeSeriesPoint(BaseModel):
    """Single time series data point."""
    timestamp: datetime
    value: float
    zone: str


# Response is just a list
TimeSeriesResponse = List[TimeSeriesPoint]


