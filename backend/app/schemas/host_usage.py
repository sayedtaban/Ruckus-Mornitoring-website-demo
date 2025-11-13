from __future__ import annotations

from pydantic import BaseModel, Field


class HostUsage(BaseModel):
    hostname: str
    dataUsage: float = Field(..., ge=0)


