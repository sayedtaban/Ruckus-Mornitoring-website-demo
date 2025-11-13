from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class Pagination(BaseModel):
    total: int = Field(..., ge=0)
    limit: int = Field(..., ge=0)
    offset: int = Field(..., ge=0)
    has_more: bool = Field(..., alias="hasMore")

    model_config = ConfigDict(populate_by_name=True)

