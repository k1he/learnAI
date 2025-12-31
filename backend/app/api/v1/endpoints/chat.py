"""Chat API endpoint for conversational visualization generation."""

import json
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from openai import AsyncOpenAI

from app.core.config import settings
from app.core.llm_client import get_shared_client
from app.core.prompts import build_conversation_messages
from app.schemas.conversation import (
    ChatRequest,
    ChatResponse,
    ChatResponseMessage,
    UsageInfo,
)
from app.services.validator import is_code_safe

logger = logging.getLogger(__name__)

router = APIRouter()


async def generate_chat_response(
    client: AsyncOpenAI,
    request: ChatRequest,
    max_retries: int = 3,
) -> ChatResponse:
    """Generate visualization code from conversation.
    
    Uses "Smart Append" context strategy:
    - Injects current code as context if modifying
    - Limits conversation history to avoid token limits
    - Validates generated code for security
    """
    # Build messages with Smart Append strategy
    user_messages = [{"role": m.role, "content": m.content} for m in request.messages]
    llm_messages = build_conversation_messages(user_messages, request.current_code)
    
    last_error: Optional[str] = None
    
    for attempt in range(max_retries):
        try:
            response = await client.chat.completions.create(
                model=request.model,
                messages=llm_messages,
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
                last_error = "Response missing required fields"
                logger.warning(f"Attempt {attempt + 1}: {last_error}")
                continue
            
            code = data["code"]
            explanation = data["explanation"]
            
            # Validate code security (check imports)
            is_safe, forbidden_modules = is_code_safe(code)
            if not is_safe:
                last_error = f"Code contains forbidden imports: {', '.join(forbidden_modules)}"
                logger.warning(f"Attempt {attempt + 1}: {last_error}")
                # Add feedback to messages and retry
                llm_messages.append({
                    "role": "assistant",
                    "content": content
                })
                llm_messages.append({
                    "role": "user", 
                    "content": f"Error: Your code imports forbidden libraries: {', '.join(forbidden_modules)}. Please only use: react, recharts, lucide-react, framer-motion, clsx, tailwind-merge. Regenerate the code."
                })
                continue
            
            # Build response
            usage = UsageInfo(
                prompt_tokens=response.usage.prompt_tokens if response.usage else 0,
                completion_tokens=response.usage.completion_tokens if response.usage else 0,
                total_tokens=response.usage.total_tokens if response.usage else 0,
            )
            
            return ChatResponse(
                message=ChatResponseMessage(
                    role="assistant",
                    content=explanation,
                    code=code,
                ),
                usage=usage,
            )
            
        except Exception as e:
            last_error = f"LLM API error: {str(e)}"
            logger.error(f"Attempt {attempt + 1}: {last_error}")
            continue
    
    # All retries failed
    raise HTTPException(
        status_code=500,
        detail=f"Failed to generate valid response after {max_retries} attempts. Last error: {last_error}"
    )


@router.post("/generate", response_model=ChatResponse)
async def chat_generate(request: ChatRequest) -> ChatResponse:
    """Generate or modify visualization via conversational chat.
    
    Accepts conversation history and optional current code.
    Returns generated/modified code with explanation.
    
    - **messages**: Conversation history (at least 1 message required)
    - **model**: LLM model to use (default: deepseek-chat)
    - **current_code**: Current visualization code (if modifying)
    """
    if not request.messages:
        raise HTTPException(status_code=400, detail="At least one message is required")
    
    client = get_shared_client()
    return await generate_chat_response(client, request)
