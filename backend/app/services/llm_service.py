"""LLM Service for generating visualizations."""

import json
import logging
from typing import Optional

from openai import AsyncOpenAI

from app.core.config import settings
from app.core.llm_client import get_shared_client
from app.schemas.generation import GeneratedContent
from app.services.prompts import SYSTEM_PROMPT, get_generation_prompt
from app.services.code_validator import validate_react_code, sanitize_code

logger = logging.getLogger(__name__)


class LLMService:
    """Service for interacting with LLM to generate visualizations."""
    
    def __init__(self, client: Optional[AsyncOpenAI] = None):
        self.client = client or get_shared_client()
        self.model = settings.DEFAULT_MODEL
    
    async def generate(
        self,
        prompt: str,
        model: Optional[str] = None,
        max_retries: int = 3
    ) -> GeneratedContent:
        """
        Generate visualization code from a natural language prompt.
        
        Args:
            prompt: User's natural language question
            model: Optional model override
            max_retries: Maximum retry attempts for JSON parsing failures
            
        Returns:
            GeneratedContent with explanation and code
            
        Raises:
            ValueError: If generation fails after all retries
        """
        use_model = model or self.model
        last_error: Optional[str] = None
        
        for attempt in range(max_retries):
            try:
                response = await self.client.chat.completions.create(
                    model=use_model,
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": get_generation_prompt(prompt)}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.7,
                    max_tokens=4096,
                )
                
                content = response.choices[0].message.content
                if not content:
                    last_error = "Empty response from LLM"
                    continue
                
                # Parse JSON response
                try:
                    data = json.loads(content)
                except json.JSONDecodeError as e:
                    last_error = f"JSON parsing failed: {str(e)}"
                    logger.warning(f"Attempt {attempt + 1}: {last_error}")
                    continue
                
                # Validate required fields
                if "explanation" not in data or "code" not in data:
                    last_error = "Response missing required fields (explanation, code)"
                    logger.warning(f"Attempt {attempt + 1}: {last_error}")
                    continue
                
                # Sanitize and validate code
                code = sanitize_code(data["code"])
                is_valid, validation_error = validate_react_code(code)
                
                if not is_valid:
                    last_error = f"Code validation failed: {validation_error}"
                    logger.warning(f"Attempt {attempt + 1}: {last_error}")
                    continue
                
                return GeneratedContent(
                    explanation=data["explanation"],
                    code=code
                )
                
            except Exception as e:
                last_error = f"LLM API error: {str(e)}"
                logger.error(f"Attempt {attempt + 1}: {last_error}")
                continue
        
        raise ValueError(f"Failed to generate valid content after {max_retries} attempts. Last error: {last_error}")


# Singleton instance
_service: Optional[LLMService] = None


def get_llm_service() -> LLMService:
    """Get or create the LLM service singleton."""
    global _service
    if _service is None:
        _service = LLMService()
    return _service
