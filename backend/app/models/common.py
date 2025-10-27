"""Common models for error handling and pagination."""
from pydantic import BaseModel
from typing import Optional, Any


class ErrorResponse(BaseModel):
    """Standard error response format."""
    error: dict[str, Any]
    
    @classmethod
    def create(cls, code: str, message: str, details: Optional[dict] = None):
        """Create an error response."""
        return cls(
            error={
                "code": code,
                "message": message,
                "details": details or {}
            }
        )


class PaginationResponse(BaseModel):
    """Pagination metadata."""
    total: int
    limit: int
    offset: int
    hasMore: bool


