"""Access point models."""
from pydantic import BaseModel
from typing import List


class Radio(BaseModel):
    """Radio information for an AP."""
    band: str  # "5GHz" | "2.4GHz"
    channel: int
    txPower: int
    noiseFloor: int
    clientCount: int


class AccessPoint(BaseModel):
    """Access point information."""
    mac: str
    name: str
    model: str
    status: str  # "online" | "offline"
    ip: str
    zoneId: str
    zoneName: str
    firmwareVersion: str
    serialNumber: str
    clientCount: int
    channelUtilization: int
    airtimeUtilization: int
    cpuUtilization: int
    memoryUtilization: int
    radios: List[Radio]


class AccessPointResponse(BaseModel):
    """Response model for access points endpoint."""
    total: int
    list: List[AccessPoint]

