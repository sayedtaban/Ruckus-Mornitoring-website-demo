from __future__ import annotations

from pydantic import BaseModel, Field


class CauseCode(BaseModel):
    code: int
    description: str
    count: int = Field(..., ge=0)
    impactScore: float = Field(..., ge=0)


