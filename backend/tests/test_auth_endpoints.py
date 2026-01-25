"""Test authentication endpoints."""
import pytest
from httpx import AsyncClient

from app.models.auth import UserRole


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
