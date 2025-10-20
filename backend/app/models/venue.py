"""Venue and zone models."""
from pydantic import BaseModel
from typing import List


class Zone(BaseModel):
    """Zone information."""
    id: str
    name: str
    totalAPs: int
    connectedAPs: int
    disconnectedAPs: int
    clients: int
    apAvailability: float
    clientsPerAP: float
    experienceScore: float
    utilization: float
    rxDesense: float
    netflixScore: float


class VenueResponse(BaseModel):
    """Response model for venue endpoint."""
    name: str
    totalZones: int
    totalAPs: int
    totalClients: int
    avgExperienceScore: float
    slaCompliance: float
    zones: List[Zone]

