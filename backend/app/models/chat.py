"""Chat request/response models."""

from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, field_validator


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    current_code: Optional[str] = None
    stream: bool = True
    model: Optional[str] = None

    @field_validator("messages")
    @classmethod
    def validate_messages(cls, value: List[ChatMessage]) -> List[ChatMessage]:
        if not value:
            raise ValueError("messages cannot be empty")
        return value


class AssistantMessage(BaseModel):
    role: Literal["assistant"] = "assistant"
    content: str
    code: Optional[str] = None


class UsageInfo(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class ChatResponse(BaseModel):
    message: AssistantMessage
    usage: UsageInfo
    style: Optional[str] = None
