"""Client/device models."""
from pydantic import BaseModel
from typing import List


class Client(BaseModel):
    """Client/device information."""
    hostname: str
    modelName: str
    ipAddress: str
    macAddress: str
    wlan: str
    apName: str
    apMac: str
    dataUsage: float
    os: str
    deviceType: str  # "phone" | "laptop" | "tablet" | "other"


class ClientResponse(BaseModel):
    """Response model for clients endpoint."""
    data: List[Client]
    pagination: dict


