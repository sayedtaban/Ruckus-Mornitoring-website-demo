from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


class HostUsage(BaseModel):
    hostname: str
    dataUsage: float = Field(..., ge=0)
    
    @field_validator('hostname', mode='before')
    @classmethod
    def validate_hostname(cls, v):
        """Ensure hostname is a string"""
        if v is None:
            return "Unknown"
        return str(v)
    
    @field_validator('dataUsage', mode='before')
    @classmethod
    def validate_data_usage(cls, v):
        """Convert dataUsage to float, defaulting to 0.0 if invalid"""
        if v is None:
            return 0.0
        try:
            return float(v)
        except (ValueError, TypeError):
            return 0.0


