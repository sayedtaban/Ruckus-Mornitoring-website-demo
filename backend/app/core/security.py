from __future__ import annotations

import bcrypt
from datetime import datetime, timedelta
from typing import Any
from jose import JWTError, jwt

from app.core.config import get_settings

settings = get_settings()

# JWT settings
SECRET_KEY = settings.secret_key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days


def _truncate_password(password: str, max_bytes: int = 72) -> str:
    """Truncate password to max_bytes to comply with bcrypt's 72-byte limit"""
    password_bytes = password.encode('utf-8')
    if len(password_bytes) <= max_bytes:
        return password
    # Truncate to max_bytes
    truncated_bytes = password_bytes[:max_bytes]
    # Remove any incomplete UTF-8 sequences at the end
    # Keep removing bytes until we can decode successfully
    while truncated_bytes:
        try:
            return truncated_bytes.decode('utf-8')
        except UnicodeDecodeError:
            truncated_bytes = truncated_bytes[:-1]
    # Fallback (shouldn't happen, but handle edge case)
    return password[:max_bytes] if len(password) >= max_bytes else password


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    # Truncate password to 72 bytes for bcrypt compatibility
    truncated_password = _truncate_password(plain_password)
    password_bytes = truncated_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    try:
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except (ValueError, TypeError):
        return False


def get_password_hash(password: str) -> str:
    """Hash a password"""
    # Truncate password to 72 bytes for bcrypt compatibility
    truncated_password = _truncate_password(password)
    password_bytes = truncated_password.encode('utf-8')
    # Generate salt and hash password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict[str, Any] | None:
    """Decode and verify a JWT access token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

