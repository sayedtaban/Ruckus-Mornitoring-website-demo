"""Host usage models."""
from pydantic import BaseModel
from typing import List


class HostUsage(BaseModel):
    """Host usage statistics."""
    hostname: str
    dataUsage: float


# Response is just a list
HostUsageResponse = List[HostUsage]

