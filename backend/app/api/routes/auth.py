from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.auth import UserRegister, UserLogin, UserResponse, Token
from app.services.auth_service import AuthService
from app.models.user import User

router = APIRouter(tags=["Authentication"])
security = HTTPBearer()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    db: Session = Depends(get_db),
) -> UserResponse:
    """Register a new user"""
    try:
        user = AuthService.create_user(db, user_data)
        return UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            is_active=user.is_active,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    db: Session = Depends(get_db),
) -> Token:
    """Login and get access token"""
    user = AuthService.authenticate_user(
        db, credentials.username, credentials.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = AuthService.create_token_for_user(user)
    return Token(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> UserResponse:
    """Get current authenticated user"""
    token = credentials.credentials
    user = AuthService.get_user_from_token(token, db)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        is_active=user.is_active,
    )


@router.post("/logout")
async def logout() -> dict[str, str]:
    """Logout (client should discard token)"""
    return {"message": "Successfully logged out"}


@router.get("/session")
async def check_session(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        HTTPBearer(auto_error=False)
    ),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    """Check if session is valid"""
    if credentials is None:
        return {"valid": False}
    token = credentials.credentials
    user = AuthService.get_user_from_token(token, db)
    return {"valid": user is not None}

