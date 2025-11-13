from __future__ import annotations

from pydantic import BaseModel


class Anomaly(BaseModel):
    id: str
    timestamp: str
    type: str
    severity: str
    description: str
    affectedZone: str | None = None
    metric: str | None = None


