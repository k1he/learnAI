"""Test authentication dependencies."""
import pytest
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import Security
from app.models.auth import User, UserProfile, UserQuota, UserRole
from app.dependencies.auth import get_current_user, get_current_active_user, require_vip, require_admin


@pytest.mark.asyncio
async def test_get_current_user_valid_token(async_client: AsyncClient, db_session: AsyncSession):
    """Test get_current_user with valid token"""
    from sqlalchemy import select
    user = User(
        id="user_123",
        email="test@example.com",
        password_hash=Security.get_password_hash("password123"),
        is_verified=True,
        role=UserRole.USER
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    token = Security.create_access_token({"sub": user.id})
    from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    result_user = await get_current_user(credentials=credentials, db=db_session)

    assert result_user is not None
    assert result_user.id == user.id


@pytest.mark.asyncio
async def test_get_current_user_invalid_token(async_client: AsyncClient, db_session: AsyncSession):
    """Test get_current_user with invalid token"""
    from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="invalid.token.here")

    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(credentials=credentials, db=db_session)

    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_require_vip_user(async_client: AsyncClient, db_session: AsyncSession):
    """Test require_vip with VIP user"""
    from sqlalchemy import select
    user = User(
        id="vip_user",
        email="vip@example.com",
        password_hash=Security.get_password_hash("password123"),
        is_verified=True,
        role=UserRole.VIP
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    token = Security.create_access_token({"sub": user.id})
    from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    result = await require_vip(await get_current_user(credentials=credentials, db=db_session))
    assert result.role == UserRole.VIP


@pytest.mark.asyncio
async def test_require_vip_regular_user(async_client: AsyncClient, db_session: AsyncSession):
    """Test require_vip blocks regular user"""
    from sqlalchemy import select
    user = User(
        id="regular_user",
        email="regular@example.com",
        password_hash=Security.get_password_hash("password123"),
        is_verified=True,
        role=UserRole.USER
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    token = Security.create_access_token({"sub": user.id})
    from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc_info:
        await require_vip(await get_current_user(credentials=credentials, db=db_session))

    assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_require_admin_user(async_client: AsyncClient, db_session: AsyncSession):
    """Test require_admin with admin user"""
    from sqlalchemy import select
    user = User(
        id="admin_user",
        email="admin@example.com",
        password_hash=Security.get_password_hash("password123"),
        is_verified=True,
        role=UserRole.ADMIN
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    token = Security.create_access_token({"sub": user.id})
    from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    result = await require_admin(await get_current_user(credentials=credentials, db=db_session))
    assert result.role == UserRole.ADMIN
