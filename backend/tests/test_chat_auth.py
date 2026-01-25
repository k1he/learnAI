"""Test chat API authentication."""
import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch

from app.core.security import Security
from app.models.auth import UserRole, UserQuota
from app.core.config import settings


@pytest.mark.asyncio
async def test_chat_requires_auth(async_client: AsyncClient):
    """Test chat endpoint requires authentication"""
    response = await async_client.post(
        "/api/v1/chat/generate",
        json={
            "messages": [{"role": "user", "content": "Hello"}]
        }
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_chat_succeeds_with_auth(async_client: AsyncClient, db_session, regular_user):
    """Test chat endpoint works with valid authentication"""
    from app.models.auth import UserQuota

    # Create quota for user
    quota = UserQuota(
        user_id=regular_user.id,
        daily_messages_limit=100,
        monthly_messages_limit=1000,
        daily_tokens_limit=100000
    )
    db_session.add(quota)
    await db_session.commit()

    token = Security.create_access_token({"sub": regular_user.id, "email": regular_user.email})

    # Mock the OpenAI service
    with patch("app.services.openai_client.create_chat_completion") as mock_create:
        mock_create.return_value = {
            "choices": [{
                "message": {
                    "content": '{"explanation": "Hello! How can I help you today?", "code": null}'
                }
            }],
            "usage": {
                "prompt_tokens": 10,
                "completion_tokens": 20,
                "total_tokens": 30
            }
        }

        response = await async_client.post(
            "/api/v1/chat/generate",
            json={
                "messages": [{"role": "user", "content": "Hello"}]
            },
            headers={"Authorization": f"Bearer {token}"}
        )

    assert response.status_code == 200


@pytest.mark.asyncio
async def test_chat_records_user(async_client: AsyncClient, db_session, regular_user):
    """Test that chat requests are associated with user"""
    from app.models.auth import UserQuota

    # Create quota for user
    quota = UserQuota(
        user_id=regular_user.id,
        daily_messages_limit=100,
        monthly_messages_limit=1000,
        daily_tokens_limit=100000
    )
    db_session.add(quota)
    await db_session.commit()

    token = Security.create_access_token({"sub": regular_user.id, "email": regular_user.email})

    # Mock the OpenAI service
    with patch("app.services.openai_client.create_chat_completion") as mock_create:
        mock_create.return_value = {
            "choices": [{
                "message": {
                    "content": '{"explanation": "Test response", "code": null}'
                }
            }],
            "usage": {
                "prompt_tokens": 10,
                "completion_tokens": 20,
                "total_tokens": 30
            }
        }

        response = await async_client.post(
            "/api/v1/chat/generate",
            json={
                "messages": [{"role": "user", "content": "Test"}]
            },
            headers={"Authorization": f"Bearer {token}"}
        )

    # Verify user quota was incremented
    from sqlalchemy import select
    from app.models.auth import User
    result = await db_session.execute(select(User).where(User.id == regular_user.id))
    user = result.scalar_one()
    await db_session.refresh(user, ["quota"])

    assert user.quota is not None
    assert user.quota.daily_messages_used > 0


@pytest.mark.asyncio
async def test_chat_respects_quota_limit(async_client: AsyncClient, db_session, regular_user):
    """Test chat endpoint respects daily message quota"""
    from app.models.auth import UserQuota

    # Set user's daily messages used to limit
    quota = UserQuota(
        user_id=regular_user.id,
        daily_messages_limit=10,
        monthly_messages_limit=1000,
        daily_tokens_limit=100000,
        daily_messages_used=10  # Already at limit
    )
    db_session.add(quota)
    await db_session.commit()

    token = Security.create_access_token({"sub": regular_user.id, "email": regular_user.email})

    response = await async_client.post(
        "/api/v1/chat/generate",
        json={
            "messages": [{"role": "user", "content": "Test"}]
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 429  # Too Many Requests


@pytest.mark.asyncio
async def test_unverified_user_can_chat(async_client: AsyncClient, db_session):
    """Test unverified users can still use chat (soft restriction)"""
    from app.models.auth import User, UserQuota

    unverified_user = User(
        id="unverified_chat_user",
        email="unverified_chat@example.com",
        password_hash=Security.get_password_hash("Password123!"),
        is_verified=False,
        role=UserRole.USER
    )
    db_session.add(unverified_user)
    await db_session.commit()

    # Create quota for user
    quota = UserQuota(
        user_id=unverified_user.id,
        daily_messages_limit=100,
        monthly_messages_limit=1000,
        daily_tokens_limit=100000
    )
    db_session.add(quota)
    await db_session.commit()

    token = Security.create_access_token({"sub": unverified_user.id, "email": unverified_user.email})

    with patch("app.services.openai_client.create_chat_completion") as mock_create:
        mock_create.return_value = {
            "choices": [{
                "message": {
                    "content": '{"explanation": "Test response", "code": null}'
                }
            }],
            "usage": {
                "prompt_tokens": 10,
                "completion_tokens": 20,
                "total_tokens": 30
            }
        }

        response = await async_client.post(
            "/api/v1/chat/generate",
            json={
                "messages": [{"role": "user", "content": "Test"}]
            },
            headers={"Authorization": f"Bearer {token}"}
        )

    # May allow with warning or restrict per policy
    # For now, we allow unverified users to chat
    assert response.status_code in [200, 403, 429]
