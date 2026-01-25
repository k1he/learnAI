"""Test configuration settings."""
import pytest
from app.core.config import Settings, settings


def test_settings_has_auth_fields():
    """Test that settings have auth-related fields"""
    assert hasattr(settings, 'secret_key')
    assert hasattr(settings, 'database_url')
    assert hasattr(settings, 'smtp_server')


@pytest.mark.asyncio
async def test_settings_default_jwt_expiry():
    """Test that JWT has reasonable default expiry"""
    assert settings.jwt_expiry_days == 7


@pytest.mark.asyncio
async def test_settings_default_quota():
    """Test that default quota values exist"""
    assert hasattr(settings, 'daily_messages_limit')
    assert settings.daily_messages_limit == 50
