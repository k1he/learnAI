"""
Authentication models: User, UserProfile, UserQuota and schemas.
"""
from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from uuid import uuid4
from sqlalchemy import String, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, EmailStr, Field

from app.db.base import Base


class UserRole(str, Enum):
    """User role enumeration."""
    USER = "user"
    VIP = "vip"
    ADMIN = "admin"


# === SQLAlchemy Models ===

class User(Base):
    """User database model."""
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    role: Mapped[str] = mapped_column(String(20), default=UserRole.USER, index=True)

    verification_code: Mapped[Optional[str]] = mapped_column(String(255))
    verification_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    reset_token: Mapped[Optional[str]] = mapped_column(String(255), index=True)
    reset_token_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    profile: Mapped[Optional["UserProfile"]] = relationship(
        "UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    quota: Mapped[Optional["UserQuota"]] = relationship(
        "UserQuota", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class UserProfile(Base):
    """User profile database model."""
    __tablename__ = "user_profiles"

    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    nickname: Mapped[Optional[str]] = mapped_column(String(100))
    avatar_url: Mapped[Optional[str]] = mapped_column(String)
    bio: Mapped[Optional[str]] = mapped_column(String(500))

    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship("User", back_populates="profile")


class UserQuota(Base):
    """User quota database model."""
    __tablename__ = "user_quotas"

    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)

    daily_messages_limit: Mapped[int] = mapped_column(Integer, default=50)
    daily_messages_used: Mapped[int] = mapped_column(Integer, default=0)
    daily_messages_reset_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    monthly_messages_limit: Mapped[int] = mapped_column(Integer, default=1000)
    monthly_messages_used: Mapped[int] = mapped_column(Integer, default=0)
    monthly_messages_reset_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    daily_tokens_limit: Mapped[int] = mapped_column(Integer, default=50000)
    daily_tokens_used: Mapped[int] = mapped_column(Integer, default=0)
    daily_tokens_reset_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    vip_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship("User", back_populates="quota")


# === Pydantic Schemas ===

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class EmailVerifyRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=6)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)


class UpdateProfileRequest(BaseModel):
    nickname: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=500)


class ProfileResponse(BaseModel):
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None


class QuotaResponse(BaseModel):
    daily_messages_limit: int
    daily_messages_used: int
    daily_messages_remaining: int
    daily_messages_reset_at: datetime

    monthly_messages_limit: int
    monthly_messages_used: int
    monthly_messages_remaining: int
    monthly_messages_reset_at: Optional[datetime]

    daily_tokens_limit: int
    daily_tokens_used: int
    daily_tokens_remaining: int
    daily_tokens_reset_at: datetime

    is_vip: bool
    vip_expires_at: Optional[datetime] = None


class UserResponse(BaseModel):
    user_id: str
    email: str
    role: str
    is_verified: bool
    created_at: datetime
    profile: Optional[ProfileResponse] = None
    quota: Optional[QuotaResponse] = None

    @classmethod
    def from_db_model(cls, user: User) -> "UserResponse":
        """Create response from database model."""
        profile = None
        if user.profile:
            profile = ProfileResponse(
                nickname=user.profile.nickname,
                avatar_url=user.profile.avatar_url,
                bio=user.profile.bio
            )

        quota = None
        if user.quota:
            now = datetime.now(timezone.utc)
            is_vip = user.role == UserRole.VIP and (user.quota.vip_expires_at is None or user.quota.vip_expires_at > now)
            quota = QuotaResponse(
                daily_messages_limit=user.quota.daily_messages_limit,
                daily_messages_used=user.quota.daily_messages_used,
                daily_messages_remaining=max(0, user.quota.daily_messages_limit - user.quota.daily_messages_used),
                daily_messages_reset_at=user.quota.daily_messages_reset_at,
                monthly_messages_limit=user.quota.monthly_messages_limit,
                monthly_messages_used=user.quota.monthly_messages_used,
                monthly_messages_remaining=max(0, user.quota.monthly_messages_limit - user.quota.monthly_messages_used),
                monthly_messages_reset_at=user.quota.monthly_messages_reset_at,
                daily_tokens_limit=user.quota.daily_tokens_limit,
                daily_tokens_used=user.quota.daily_tokens_used,
                daily_tokens_remaining=max(0, user.quota.daily_tokens_limit - user.quota.daily_tokens_used),
                daily_tokens_reset_at=user.quota.daily_messages_reset_at,
                is_vip=is_vip,
                vip_expires_at=user.quota.vip_expires_at
            )

        return cls(
            user_id=user.id,
            email=user.email,
            role=user.role,
            is_verified=user.is_verified,
            created_at=user.created_at,
            profile=profile,
            quota=quota
        )


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse
