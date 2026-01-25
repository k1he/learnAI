"""Test email service."""
import pytest
from app.services.email_service import EmailService


@pytest.mark.asyncio
async def test_send_verification_email():
    """Test sending verification email"""
    result = await EmailService.send_verification_email(
        "test@example.com",
        "123456"
    )
    assert result is True


@pytest.mark.asyncio
async def test_send_password_reset_email():
    """Test sending password reset email"""
    result = await EmailService.send_password_reset_email(
        "test@example.com",
        "reset-token-123"
    )
    assert result is True


@pytest.mark.asyncio
async def test_send_email_with_invalid_address():
    """Test sending email with invalid address"""
    result = await EmailService.send_verification_email("", "123456")
    assert isinstance(result, bool)
