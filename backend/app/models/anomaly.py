"""Anomaly models."""
from pydantic import BaseModel
from typing import List
from datetime import datetime


class Anomaly(BaseModel):
    """Network anomaly."""
    id: str
    timestamp: datetime
    type: str
    severity: str  # "critical" | "major" | "warning" | "info"
    description: str
    affectedZone: str
    metric: str


# Response is just a list
AnomalyResponse = List[Anomaly]


