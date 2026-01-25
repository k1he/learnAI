"""Test security utilities."""
import pytest
from app.core.security import Security


def test_verify_password():
    """Test password verification"""
    hash_result = Security.get_password_hash("test_password")
    assert isinstance(hash_result, str)
    assert hash_result != "test_password"
    assert Security.verify_password("test_password", hash_result) is True
    assert Security.verify_password("wrong_password", hash_result) is False


def test_create_access_token():
    """Test JWT token creation"""
    token = Security.create_access_token({"sub": "user_123"})
    assert isinstance(token, str)
    assert len(token.split('.')) == 3


def test_decode_access_token():
    """Test JWT token decoding"""
    data = {"sub": "user_123", "email": "test@example.com"}
    token = Security.create_access_token(data)
    decoded = Security.decode_access_token(token)

    assert decoded is not None
    assert decoded["sub"] == "user_123"
    assert decoded["email"] == "test@example.com"
    assert "exp" in decoded
    assert "iat" in decoded


def test_decode_invalid_token():
    """Test decoding invalid token"""
    assert Security.decode_access_token("invalid.token.here") is None


def test_generate_verification_code():
    """Test verification code generation"""
    code = Security.generate_verification_code()
    assert isinstance(code, str)
    assert len(code) == 6
    assert code.isdigit()


def test_generate_reset_token():
    """Test password reset token generation"""
    token = Security.generate_reset_token()
    assert isinstance(token, str)
    assert len(token) >= 20
