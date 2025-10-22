"""OS distribution models."""
from pydantic import BaseModel
from typing import List


class OSDistribution(BaseModel):
    """OS distribution percentage."""
    os: str
    percentage: float
    color: str


# Response is just a list
OSDistributionResponse = List[OSDistribution]


