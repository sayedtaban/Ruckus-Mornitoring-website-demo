from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    """Schema for user registration"""

    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    email: EmailStr | None = None


class UserLogin(BaseModel):
    """Schema for user login"""

    username: str
    password: str


class UserResponse(BaseModel):
    """Schema for user response"""

    id: int
    username: str
    email: str
    is_active: bool

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema for authentication token"""

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema for token data"""

    username: str | None = None

