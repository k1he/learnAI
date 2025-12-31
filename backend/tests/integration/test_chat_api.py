"""Integration tests for Chat API endpoint."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.conversation import ChatRequest, ChatMessage


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def mock_openai_response():
    """Create mock OpenAI response."""
    mock_response = MagicMock()
    mock_response.choices = [
        MagicMock(
            message=MagicMock(
                content='{"explanation": "A simple sine wave visualization.", "code": "import React from \'react\';\\nexport default function App() { return <div>Hello</div>; }"}'
            )
        )
    ]
    mock_response.usage = MagicMock(
        prompt_tokens=100,
        completion_tokens=50,
        total_tokens=150,
    )
    return mock_response


class TestChatGenerateEndpoint:
    """Tests for /api/v1/chat/generate endpoint."""

    def test_generate_success(self, client, mock_openai_response):
        """Test successful generation with valid request."""
        with patch("app.api.v1.endpoints.chat.get_shared_client") as mock_client:
            mock_async_client = AsyncMock()
            mock_async_client.chat.completions.create = AsyncMock(
                return_value=mock_openai_response
            )
            mock_client.return_value = mock_async_client

            response = client.post(
                "/api/v1/chat/generate",
                json={
                    "messages": [
                        {"role": "user", "content": "Show me a sine wave"}
                    ]
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert "message" in data
            assert data["message"]["role"] == "assistant"
            assert "content" in data["message"]
            assert "code" in data["message"]
            assert "usage" in data

    def test_generate_with_current_code(self, client, mock_openai_response):
        """Test modification with existing code context."""
        with patch("app.api.v1.endpoints.chat.get_shared_client") as mock_client:
            mock_async_client = AsyncMock()
            mock_async_client.chat.completions.create = AsyncMock(
                return_value=mock_openai_response
            )
            mock_client.return_value = mock_async_client

            response = client.post(
                "/api/v1/chat/generate",
                json={
                    "messages": [
                        {"role": "user", "content": "Make the line red"}
                    ],
                    "current_code": "import React from 'react';\nexport default function App() { return <div>Original</div>; }"
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert data["message"]["code"] is not None

    def test_generate_empty_messages(self, client):
        """Test validation error for empty messages."""
        response = client.post(
            "/api/v1/chat/generate",
            json={"messages": []}
        )

        assert response.status_code == 422  # Validation error

    def test_generate_missing_messages(self, client):
        """Test validation error for missing messages field."""
        response = client.post(
            "/api/v1/chat/generate",
            json={}
        )

        assert response.status_code == 422

    def test_generate_invalid_role(self, client):
        """Test validation error for invalid message role."""
        response = client.post(
            "/api/v1/chat/generate",
            json={
                "messages": [
                    {"role": "invalid_role", "content": "test"}
                ]
            }
        )

        assert response.status_code == 422


class TestChatRequestValidation:
    """Tests for ChatRequest schema validation."""

    def test_valid_request(self):
        """Test valid request parsing."""
        request = ChatRequest(
            messages=[
                ChatMessage(role="user", content="Hello")
            ]
        )
        assert len(request.messages) == 1
        assert request.model == "deepseek-chat"
        assert request.current_code is None

    def test_request_with_all_fields(self):
        """Test request with all optional fields."""
        request = ChatRequest(
            messages=[
                ChatMessage(role="user", content="Hello"),
                ChatMessage(role="assistant", content="Hi there"),
            ],
            model="gpt-4",
            current_code="const x = 1;"
        )
        assert len(request.messages) == 2
        assert request.model == "gpt-4"
        assert request.current_code == "const x = 1;"

    def test_request_multiple_messages(self):
        """Test request with conversation history."""
        request = ChatRequest(
            messages=[
                ChatMessage(role="system", content="You are helpful"),
                ChatMessage(role="user", content="Show sine wave"),
                ChatMessage(role="assistant", content="Here it is"),
                ChatMessage(role="user", content="Make it red"),
            ]
        )
        assert len(request.messages) == 4
