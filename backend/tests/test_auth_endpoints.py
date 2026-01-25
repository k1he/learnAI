"""Test authentication endpoints."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auth import UserRole, User
from app.core.security import Security


@pytest.mark.asyncio
async def test_register_success(async_client: AsyncClient):
    """Test successful user registration"""
    response = await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "Password123!"
        }
    )

    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert data["data"]["user_id"]
    assert data["data"]["email"] == "newuser@example.com"
    assert data["data"]["is_verified"] is False
    assert data["data"]["role"] == UserRole.USER


@pytest.mark.asyncio
async def test_register_weak_password(async_client: AsyncClient):
    """Test registration with weak password"""
    response = await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "weak"
        }
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_duplicate_email(async_client: AsyncClient, db_session):
    """Test registration with duplicate email"""
    # First registration
    await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": "duplicate@example.com",
            "password": "Password123!"
        }
    )

    # Second registration with same email
    response = await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": "duplicate@example.com",
            "password": "Password456!"
        }
    )

    assert response.status_code == 400


@pytest.mark.asyncio
async def test_register_invalid_email(async_client: AsyncClient):
    """Test registration with invalid email"""
    response = await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": "not-an-email",
            "password": "Password123!"
        }
    )

    assert response.status_code == 422


# Login tests

@pytest.mark.asyncio
async def test_login_success(async_client: AsyncClient, db_session: AsyncSession):
    """Test successful login"""
    from sqlalchemy import select
    user = User(
        id="login_user",
        email="login@example.com",
        password_hash=Security.get_password_hash("CorrectPassword123!"),
        is_verified=True,
        role=UserRole.USER
    )
    db_session.add(user)
    await db_session.commit()

    response = await async_client.post(
        "/api/v1/auth/login",
        json={
            "email": "login@example.com",
            "password": "CorrectPassword123!"
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["token_type"] == "bearer"
    assert "expires_in" in data["data"]
    assert data["data"]["user"]["email"] == "login@example.com"


@pytest.mark.asyncio
async def test_login_wrong_password(async_client: AsyncClient, db_session: AsyncSession):
    """Test login with wrong password"""
    from sqlalchemy import select
    user = User(
        id="wrong_pwd_user",
        email="wrong@example.com",
        password_hash=Security.get_password_hash("CorrectPassword123!"),
        is_verified=True,
        role=UserRole.USER
    )
    db_session.add(user)
    await db_session.commit()

    response = await async_client.post(
        "/api/v1/auth/login",
        json={
            "email": "wrong@example.com",
            "password": "WrongPassword"
        }
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_user_not_found(async_client: AsyncClient):
    """Test login with non-existent user"""
    response = await async_client.post(
        "/api/v1/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "SomePassword123!"
        }
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_unverified_user(async_client: AsyncClient, db_session: AsyncSession):
    """Test login with unverified user"""
    from sqlalchemy import select
    user = User(
        id="unverified_user",
        email="unverified@example.com",
        password_hash=Security.get_password_hash("Password123!"),
        is_verified=False,  # Not verified
        role=UserRole.USER
    )
    db_session.add(user)
    await db_session.commit()

    response = await async_client.post(
        "/api/v1/auth/login",
        json={
            "email": "unverified@example.com",
            "password": "Password123!"
        }
    )

    # Should still allow login but might have restrictions
    assert response.status_code in [200, 403]


@pytest.mark.asyncio
async def test_login_vip_user(async_client: AsyncClient, db_session: AsyncSession):
    """Test login with VIP user"""
    from sqlalchemy import select
    user = User(
        id="vip_login_user",
        email="vip_login@example.com",
        password_hash=Security.get_password_hash("VIPPassword123!"),
        is_verified=True,
        role=UserRole.VIP
    )
    db_session.add(user)
    await db_session.commit()

    response = await async_client.post(
        "/api/v1/auth/login",
        json={
            "email": "vip_login@example.com",
            "password": "VIPPassword123!"
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert data["data"]["user"]["role"] == UserRole.VIP


# Password reset tests

@pytest.mark.asyncio
async def test_forgot_password_success(async_client: AsyncClient, db_session):
    """Test forgot password request for existing user"""
    from sqlalchemy import select
    user = User(
        id="reset_user",
        email="reset@example.com",
        password_hash=Security.get_password_hash("OldPassword123!"),
        is_verified=True,
        role=UserRole.USER
    )
    db_session.add(user)
    await db_session.commit()

    response = await async_client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "reset@example.com"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "message" in data


@pytest.mark.asyncio
async def test_forgot_password_nonexistent_user(async_client: AsyncClient):
    """Test forgot password for non-existent user"""
    response = await async_client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "nonexistent@example.com"}
    )

    # For security, still return 200 to avoid email enumeration
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_reset_password_success(async_client: AsyncClient, db_session):
    """Test successful password reset with valid token"""
    from sqlalchemy import select
    from datetime import datetime, timedelta, timezone

    # Create user
    user = User(
        id="reset_token_user",
        email="reset_token@example.com",
        password_hash=Security.get_password_hash("OldPassword123!"),
        is_verified=True,
        role=UserRole.USER
    )
    db_session.add(user)
    await db_session.commit()

    # Set reset token (simulating forgot-password flow)
    reset_token = Security.generate_reset_token()
    reset_expires = datetime.now(timezone.utc) + timedelta(hours=1)
    user.reset_token = reset_token
    user.reset_token_expires_at = reset_expires
    await db_session.commit()

    # Reset password
    response = await async_client.post(
        "/api/v1/auth/reset-password",
        json={
            "token": reset_token,
            "new_password": "NewPassword456!"
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

    # Verify password changed
    await db_session.refresh(user)
    assert not Security.verify_password("OldPassword123!", user.password_hash)
    assert Security.verify_password("NewPassword456!", user.password_hash)


@pytest.mark.asyncio
async def test_reset_password_invalid_token(async_client: AsyncClient):
    """Test reset password with invalid token"""
    response = await async_client.post(
        "/api/v1/auth/reset-password",
        json={
            "token": "invalid-token-xyz123",
            "new_password": "NewPassword456!"
        }
    )

    assert response.status_code == 400


@pytest.mark.asyncio
async def test_reset_password_expired_token(async_client: AsyncClient, db_session):
    """Test reset password with expired token"""
    from sqlalchemy import select
    from datetime import datetime, timedelta, timezone

    # Create user with expired token
    user = User(
        id="expired_token_user",
        email="expired@example.com",
        password_hash=Security.get_password_hash("OldPassword123!"),
        is_verified=True,
        role=UserRole.USER
    )
    reset_token = Security.generate_reset_token()
    reset_expires = datetime.now(timezone.utc) - timedelta(hours=1)  # Expired
    user.reset_token = reset_token
    user.reset_token_expires_at = reset_expires
    db_session.add(user)
    await db_session.commit()

    response = await async_client.post(
        "/api/v1/auth/reset-password",
        json={
            "token": reset_token,
            "new_password": "NewPassword456!"
        }
    )

    assert response.status_code == 400


# Profile tests

@pytest.mark.asyncio
async def test_update_profile_success(async_client: AsyncClient, db_session):
    """Test updating user profile"""
    from sqlalchemy import select

    user = User(
        id="profile_user",
        email="profile@example.com",
        password_hash=Security.get_password_hash("Password123!"),
        is_verified=True,
        role=UserRole.USER
    )
    db_session.add(user)
    await db_session.commit()

    token = Security.create_access_token({"sub": user.id})

    response = await async_client.put(
        "/api/v1/auth/profile",
        json={
            "nickname": "New Nickname",
            "bio": "Updated bio",
            "avatar_url": "https://example.com/avatar.png"
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["profile"]["nickname"] == "New Nickname"
    assert data["data"]["profile"]["bio"] == "Updated bio"
    assert data["data"]["profile"]["avatar_url"] == "https://example.com/avatar.png"


@pytest.mark.asyncio
async def test_update_profile_partial(async_client: AsyncClient, db_session):
    """Test partial profile update"""
    from sqlalchemy import select

    user = User(
        id="partial_user",
        email="partial@example.com",
        password_hash=Security.get_password_hash("Password123!"),
        is_verified=True,
        role=UserRole.USER
    )
    db_session.add(user)
    await db_session.commit()

    token = Security.create_access_token({"sub": user.id})

    response = await async_client.put(
        "/api/v1/auth/profile",
        json={"nickname": "Only Nickname"},
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["data"]["profile"]["nickname"] == "Only Nickname"


@pytest.mark.asyncio
async def test_update_profile_unauthenticated(async_client: AsyncClient):
    """Test updating profile without authentication"""
    response = await async_client.put(
        "/api/v1/auth/profile",
        json={"nickname": "Hacker"}
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_quota(async_client: AsyncClient, db_session):
    """Test getting user quota information"""
    from app.models.auth import UserQuota
    from datetime import datetime, timezone

    user = User(
        id="quota_user",
        email="quota@example.com",
        password_hash=Security.get_password_hash("Password123!"),
        is_verified=True,
        role=UserRole.USER
    )
    db_session.add(user)
    await db_session.flush()

    quota = UserQuota(
        user_id=user.id,
        daily_messages_limit=100,
        daily_messages_used=25,
        monthly_messages_limit=1000,
        monthly_messages_used=500,
        daily_tokens_limit=50000,
        daily_tokens_used=10000
    )
    db_session.add(quota)
    await db_session.commit()

    token = Security.create_access_token({"sub": user.id})

    response = await async_client.get(
        "/api/v1/auth/quota",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["daily_messages_limit"] == 100
    assert data["data"]["daily_messages_used"] == 25
    assert data["data"]["daily_messages_remaining"] == 75
    assert data["data"]["is_vip"] is False


@pytest.mark.asyncio
async def test_get_vip_quota(async_client: AsyncClient, db_session):
    """Test getting VIP user quota"""
    from datetime import datetime, timedelta, timezone
    from app.models.auth import UserQuota

    user = User(
        id="vip_quota_user",
        email="vip_quota@example.com",
        password_hash=Security.get_password_hash("Password123!"),
        is_verified=True,
        role=UserRole.VIP
    )
    db_session.add(user)
    await db_session.flush()

    quota = UserQuota(
        user_id=user.id,
        daily_messages_limit=500,  # VIP gets higher limits
        daily_messages_used=100,
        monthly_messages_limit=10000,
        monthly_messages_used=1000,
        daily_tokens_limit=500000,
        daily_tokens_used=50000,
        vip_expires_at=datetime.now(timezone.utc) + timedelta(days=30)
    )
    db_session.add(quota)
    await db_session.commit()

    token = Security.create_access_token({"sub": user.id})

    response = await async_client.get(
        "/api/v1/auth/quota",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["data"]["daily_messages_limit"] == 500
    assert data["data"]["is_vip"] is True
    assert data["data"]["vip_expires_at"] is not None


@pytest.mark.asyncio
async def test_update_profile_invalid_nickname_length(async_client: AsyncClient, db_session):
    """Test profile update with nickname exceeding max length"""
    user = User(
        id="long_user",
        email="long@example.com",
        password_hash=Security.get_password_hash("Password123!"),
        is_verified=True,
        role=UserRole.USER
    )
    db_session.add(user)
    await db_session.commit()

    token = Security.create_access_token({"sub": user.id})

    response = await async_client.put(
        "/api/v1/auth/profile",
        json={"nickname": "A" * 101},  # Exceeds 100 char limit
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 422
