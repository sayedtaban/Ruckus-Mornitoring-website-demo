from __future__ import annotations

from pydantic import BaseModel, Field


class OsDistribution(BaseModel):
    os: str
    percentage: float = Field(..., ge=0)
    color: str | None = None


