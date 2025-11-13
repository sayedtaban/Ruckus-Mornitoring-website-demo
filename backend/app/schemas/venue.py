from __future__ import annotations

from pydantic import BaseModel, Field


class ZoneSummary(BaseModel):
    id: str
    name: str
    domainName: str | None = None
    totalAPs: int = Field(..., ge=0)
    connectedAPs: int = Field(..., ge=0)
    disconnectedAPs: int = Field(..., ge=0)
    clients: int = Field(..., ge=0)
    apAvailability: float = Field(..., ge=0)
    clientsPerAP: float = Field(..., ge=0)
    experienceScore: float = Field(..., ge=0)
    utilization: float = Field(..., ge=0)
    rxDesense: float
    netflixScore: float = Field(..., ge=0)


class VenueResponse(BaseModel):
    name: str
    totalZones: int = Field(..., ge=0)
    totalAPs: int = Field(..., ge=0)
    totalClients: int = Field(..., ge=0)
    avgExperienceScore: float = Field(..., ge=0)
    slaCompliance: float = Field(..., ge=0)
    zones: list[ZoneSummary]

