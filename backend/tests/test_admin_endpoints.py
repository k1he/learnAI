"""Test admin endpoints."""
import pytest
from httpx import AsyncClient
from datetime import datetime, timezone, timedelta

from app.core.security import Security
from app.models.auth import User, UserRole, UserQuota


@pytest.mark.asyncio
async def test_set_user_to_vip(async_client: AsyncClient, db_session, admin_user):
    """Test admin setting a regular user to VIP"""
    from sqlalchemy import select

    regular_user = User(
        id="promote_user",
        email="promote@example.com",
        password_hash=Security.get_password_hash("Password123!"),
        is_verified=True,
        role=UserRole.USER
    )
    db_session.add(regular_user)
    await db_session.commit()

    admin_token = Security.create_access_token({"sub": admin_user.id})

    response = await async_client.put(
        f"/api/v1/admin/users/{regular_user.id}/role",
        json={"role": UserRole.VIP},
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["role"] == UserRole.VIP


@pytest.mark.asyncio
async def test_set_user_to_vip_non_admin(async_client: AsyncClient, db_session, regular_user):
    """Test non-admin cannot set user role"""
    from sqlalchemy import select

    target_user = User(
        id="target_user",
        email="target@example.com",
        password_hash=Security.get_password_hash("Password123!"),
        is_verified=True,
        role=UserRole.USER
    )
    db_session.add(target_user)
    await db_session.commit()

    regular_token = Security.create_access_token({"sub": regular_user.id})

    response = await async_client.put(
        f"/api/v1/admin/users/{target_user.id}/role",
        json={"role": UserRole.VIP},
        headers={"Authorization": f"Bearer {regular_token}"}
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_set_user_to_vip_unauthenticated(async_client: AsyncClient, db_session):
    """Test unauthenticated user cannot set role"""
    from sqlalchemy import select

    user = User(
        id="unauth_target",
        email="unauth@example.com",
        password_hash=Security.get_password_hash("Password123!"),
        is_verified=True,
        role=UserRole.USER
    )
    db_session.add(user)
    await db_session.commit()

    response = await async_client.put(
        f"/api/v1/admin/users/{user.id}/role",
        json={"role": UserRole.VIP}
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_users(async_client: AsyncClient, db_session, admin_user):
    """Test admin can list users"""
    # Create some test users
    for i in range(3):
        user = User(
            id=f"list_user_{i}",
            email=f"listuser{i}@example.com",
            password_hash=Security.get_password_hash("Password123!"),
            is_verified=True,
            role=UserRole.USER
        )
        db_session.add(user)
    await db_session.commit()

    admin_token = Security.create_access_token({"sub": admin_user.id})

    response = await async_client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]["users"]) >= 4  # admin + 3 test users
