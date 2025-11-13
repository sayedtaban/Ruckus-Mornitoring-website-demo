from __future__ import annotations

from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
)
from app.core.database import get_db


class AuthService:
    """Service for authentication operations"""

    @staticmethod
    def create_user(db: Session, user_data: UserRegister) -> User:
        """Create a new user"""
        # Generate email from username if not provided
        email = user_data.email or f"{user_data.username}@smartzone.local"

        # Check if user already exists
        existing_user = (
            db.query(User)
            .filter(
                (User.username == user_data.username) | (User.email == email)
            )
            .first()
        )
        if existing_user:
            if existing_user.username == user_data.username:
                raise ValueError("Username already exists")
            raise ValueError("Email already exists")

        # Create new user
        hashed_password = get_password_hash(user_data.password)
        db_user = User(
            username=user_data.username,
            email=email,
            hashed_password=hashed_password,
            is_active=True,
        )
        db.add(db_user)
        try:
            db.commit()
            db.refresh(db_user)
            return db_user
        except IntegrityError:
            db.rollback()
            raise ValueError("User already exists")

    @staticmethod
    def authenticate_user(db: Session, username: str, password: str) -> User | None:
        """Authenticate a user by username and password"""
        user = db.query(User).filter(User.username == username).first()
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        if not user.is_active:
            return None
        return user

    @staticmethod
    def get_user_by_username(db: Session, username: str) -> User | None:
        """Get user by username"""
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> User | None:
        """Get user by ID"""
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def create_token_for_user(user: User) -> str:
        """Create access token for a user"""
        token_data = {"sub": user.username, "user_id": user.id}
        return create_access_token(data=token_data)

    @staticmethod
    def get_user_from_token(token: str, db: Session) -> User | None:
        """Get user from JWT token"""
        payload = decode_access_token(token)
        if payload is None:
            return None
        username: str = payload.get("sub")
        if username is None:
            return None
        return AuthService.get_user_by_username(db, username)

