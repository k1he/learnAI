"""Test authentication models."""
import pytest
from datetime import datetime, timezone
from app.models.auth import UserRole, User, UserProfile, UserQuota, QuotaResponse


def test_user_role_enum_values():
    """Test that user role enum has correct values"""
    assert UserRole.USER.value == "user"
    assert UserRole.VIP.value == "vip"
    assert UserRole.ADMIN.value == "admin"


def test_user_model_creation():
    """Test creating a User model"""
    user = User(
        id="user_123",
        email="test@example.com",
        password_hash="hashed_password",
        role="user",
        is_verified=False
    )
    assert user.id == "user_123"
    assert user.email == "test@example.com"
    assert user.role == "user"
    assert user.is_verified is False


def test_user_profile_model_creation():
    """Test creating a UserProfile model"""
    profile = UserProfile(
        user_id="user_123",
        nickname="Test User",
        bio="A test user"
    )
    assert profile.user_id == "user_123"
    assert profile.nickname == "Test User"
    assert profile.bio == "A test user"


def test_user_quota_model_creation():
    """Test creating a UserQuota model"""
    quota = UserQuota(
        user_id="user_123",
        daily_messages_limit=50,
        daily_messages_used=0,
        monthly_messages_limit=1000
    )
    assert quota.user_id == "user_123"
    assert quota.daily_messages_limit == 50
    assert quota.monthly_messages_limit == 1000


def test_quota_response_calculation():
    """Test that quota remaining is calculated correctly"""
    now = datetime.now(timezone.utc)
    response = QuotaResponse(
        daily_messages_limit=50,
        daily_messages_used=10,
        daily_messages_remaining=40,
        daily_messages_reset_at=now,
        monthly_messages_limit=1000,
        monthly_messages_used=200,
        monthly_messages_remaining=800,
        monthly_messages_reset_at=now,
        daily_tokens_limit=50000,
        daily_tokens_used=5000,
        daily_tokens_remaining=45000,
        daily_tokens_reset_at=now,
        is_vip=False
    )
    assert response.daily_messages_remaining == 40
    assert response.monthly_messages_remaining == 800
    assert response.daily_tokens_remaining == 45000
