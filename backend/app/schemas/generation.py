"""Pydantic schemas for generation API."""

from pydantic import BaseModel, Field
from typing import Optional, Literal


class GenerationRequest(BaseModel):
    """Request schema for code generation."""
    
    prompt: str = Field(
        ...,
        min_length=2,
        max_length=1000,
        description="The natural language question or concept to visualize"
    )
    model: Optional[str] = Field(
        default=None,
        description="Optional LLM model override"
    )


class GeneratedContent(BaseModel):
    """The structured output from LLM."""
    
    explanation: str = Field(
        ...,
        description="Textual explanation of the concept"
    )
    code: str = Field(
        ...,
        description="React component code string"
    )


class GenerationResponse(BaseModel):
    """API response schema for generation endpoint."""
    
    status: Literal["success", "error"] = Field(
        ...,
        description="Status of the generation"
    )
    data: Optional[GeneratedContent] = Field(
        default=None,
        description="Generated content (if success)"
    )
    error: Optional[str] = Field(
        default=None,
        description="Error message (if error)"
    )


class ErrorResponse(BaseModel):
    """Standard error response format."""
    
    detail: str = Field(
        ...,
        description="Error detail message"
    )
