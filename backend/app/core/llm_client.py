"""LLM Client Factory - Creates AsyncOpenAI client with custom base_url."""

from openai import AsyncOpenAI
from app.core.config import settings


def get_llm_client() -> AsyncOpenAI:
    """
    Factory function to create an AsyncOpenAI client.
    
    Uses custom base_url for DeepSeek/Qwen compatibility.
    """
    return AsyncOpenAI(
        api_key=settings.LLM_API_KEY,
        base_url=settings.LLM_BASE_URL,
    )


# Singleton instance for reuse
_client: AsyncOpenAI | None = None


def get_shared_client() -> AsyncOpenAI:
    """Get or create a shared LLM client instance."""
    global _client
    if _client is None:
        _client = get_llm_client()
    return _client
