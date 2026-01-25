"""
Security utilities: JWT, password hashing, verification codes.
"""
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings


class Security:
    """Security utility class for authentication."""

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    SECRET_KEY = settings.secret_key
    ALGORITHM = settings.jwt_algorithm
    ACCESS_TOKEN_EXPIRE_DAYS = settings.jwt_expiry_days

    @classmethod
    def verify_password(cls, plain_password: str, hashed_password: str) -> bool:
        """Verify a plain password against a hash."""
        return cls.pwd_context.verify(plain_password, hashed_password)

    @classmethod
    def get_password_hash(cls, password: str) -> str:
        """Generate password hash."""
        return cls.pwd_context.hash(password)

    @classmethod
    def create_access_token(cls, data: dict) -> str:
        """Create a JWT access token."""
        to_encode = data.copy()
        now = datetime.now(timezone.utc)
        expire = now + timedelta(days=cls.ACCESS_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire, "iat": now})
        return jwt.encode(to_encode, cls.SECRET_KEY, algorithm=cls.ALGORITHM)

    @classmethod
    def decode_access_token(cls, token: str) -> Optional[dict]:
        """Decode and verify a JWT access token."""
        try:
            payload = jwt.decode(token, cls.SECRET_KEY, algorithms=[cls.ALGORITHM])
            return payload
        except JWTError:
            return None

    @classmethod
    def generate_verification_code(cls) -> str:
        """Generate a 6-digit verification code."""
        return "".join(secrets.choice("0123456789") for _ in range(6))

    @classmethod
    def generate_reset_token(cls) -> str:
        """Generate a password reset token."""
        return secrets.token_urlsafe(24)
