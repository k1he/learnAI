"""Pydantic schemas for conversational chat API."""

from typing import Literal, Optional
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """A single message in the conversation."""
    role: Literal["user", "assistant", "system"]
    content: str


class ChatRequest(BaseModel):
    """Request body for chat generation endpoint."""
    messages: list[ChatMessage] = Field(..., min_length=1)
    model: str = Field(default="deepseek-chat")
    current_code: Optional[str] = Field(
        default=None,
        description="The current React code state (if modifying existing visualization)"
    )


class ChatResponseMessage(BaseModel):
    """Response message containing generated content."""
    role: Literal["assistant"] = "assistant"
    content: str = Field(..., description="Explanation text")
    code: Optional[str] = Field(
        default=None,
        description="The generated/modified React code"
    )


class UsageInfo(BaseModel):
    """Token usage information."""
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0


class ChatResponse(BaseModel):
    """Response body for chat generation endpoint."""
    message: ChatResponseMessage
    usage: UsageInfo = Field(default_factory=UsageInfo)
