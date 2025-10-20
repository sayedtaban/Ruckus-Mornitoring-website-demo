"""Cause code models."""
from pydantic import BaseModel
from typing import List


class CauseCode(BaseModel):
    """802.11 disconnect cause code."""
    code: int
    description: str
    count: int
    impactScore: float


# Response is just a list
CauseCodeResponse = List[CauseCode]

