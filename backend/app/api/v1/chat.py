"""Chat completion endpoints."""

from __future__ import annotations

import json
import logging
from typing import Any, Literal, Annotated
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.response import ErrorResponse, SuccessResponse
from app.db.session import get_db
from app.models.auth import User, UserQuota
from app.dependencies.auth import get_current_user
from app.models.chat import AssistantMessage, ChatRequest, ChatResponse, UsageInfo
from app.services import openai_client
from app.services.code_validator import ValidationResult, sanitize_code, validate_code
from app.services.prompt_builder import PromptBuilder

router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger(__name__)

FRIENDLY_ERROR_MESSAGES = [
    "服务器遇到了量子纠缠 🌀，请稍后重试或换个问法",
    "AI 陷入了深度思考 🤔，建议换个角度提问",
    "代码宇宙发生了轻微扰动 ✨，请重新提问试试",
    "模型进入了薛定谔状态 🐱，刷新后可能会更好",
    "遇到了时空涟漪 🌊，建议简化问题或重新描述",
]


def _get_friendly_error() -> str:
    import random
    return random.choice(FRIENDLY_ERROR_MESSAGES)


def _usage_from_payload(usage: Any) -> UsageInfo:
    if usage is None:
        return UsageInfo(prompt_tokens=0, completion_tokens=0, total_tokens=0)
    if isinstance(usage, dict):
        return UsageInfo(
            prompt_tokens=usage.get("prompt_tokens", 0),
            completion_tokens=usage.get("completion_tokens", 0),
            total_tokens=usage.get("total_tokens", 0),
        )
    return UsageInfo(
        prompt_tokens=getattr(usage, "prompt_tokens", 0),
        completion_tokens=getattr(usage, "completion_tokens", 0),
        total_tokens=getattr(usage, "total_tokens", 0),
    )


def _extract_completion_content(completion: Any) -> tuple[str, UsageInfo]:
    if isinstance(completion, dict):
        content = completion["choices"][0]["message"]["content"]
        usage = completion.get("usage") or {}
        return content, _usage_from_payload(usage)

    content = completion.choices[0].message.content
    usage = completion.usage
    return content, _usage_from_payload(usage)


def _parse_llm_json(raw: str) -> tuple[str, str | None]:
    """Parse LLM JSON response, extract explanation and code."""
    data = json.loads(raw)
    explanation = data.get("explanation", "")
    code = data.get("code")
    if code:
        code = sanitize_code(code)
    return explanation, code


async def check_chat_quota(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Check if user has available quota for chat."""
    # Ensure quota exists
    if not current_user.quota:
        # Create quota if not exists
        quota = UserQuota(
            user_id=current_user.id,
            daily_messages_limit=settings.daily_messages_limit,
            monthly_messages_limit=settings.monthly_messages_limit,
            daily_tokens_limit=settings.daily_tokens_limit
        )
        db.add(quota)
        await db.commit()
        await db.refresh(current_user)

    now = datetime.now(timezone.utc)

    # Check if daily quota has reset
    if current_user.quota.daily_messages_reset_at and \
       current_user.quota.daily_messages_reset_at <= now:
        current_user.quota.daily_messages_used = 0
        current_user.quota.daily_tokens_used = 0
        current_user.quota.daily_messages_reset_at = now + timedelta(days=1)

    # Check if monthly quota has reset
    if current_user.quota.monthly_messages_reset_at and \
       current_user.quota.monthly_messages_reset_at <= now:
        current_user.quota.monthly_messages_used = 0
        current_user.quota.monthly_messages_reset_at = now + timedelta(days=30)

    # Check daily message quota
    if current_user.quota.daily_messages_used >= current_user.quota.daily_messages_limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Daily message quota exceeded"
        )

    # Check monthly message quota
    if current_user.quota.monthly_messages_used >= current_user.quota.monthly_messages_limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Monthly message quota exceeded"
        )

    return current_user


@router.post("/generate")
async def generate_chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_chat_quota)
):
    """
    Generate chat completion with JSX code.

    - Requires authentication
    - Enforces quota limits
    - Tracks usage per user
    """
    model = request.model or settings.default_model
    prompt_builder = PromptBuilder()

    # Increment usage at the start
    if current_user.quota:
        current_user.quota.daily_messages_used += 1
        current_user.quota.monthly_messages_used += 1
        await db.commit()

    # Get last user message for classification
    last_user_message = ""
    for msg in reversed(request.messages):
        if msg.role == "user":
            last_user_message = msg.content
            break

    # Classify query style
    classifier_messages = prompt_builder.build_classifier_messages(last_user_message)
    try:
        style = openai_client.classify_query(last_user_message, classifier_messages, model)
    except Exception as e:
        logger.warning(f"Classification failed, defaulting to LIVELY: {e}")
        style = "LIVELY"

    logger.info(f"Query style: {style}")

    # Build messages with appropriate prompt
    base_messages = prompt_builder.build(request.messages, request.current_code, style)

    MAX_RETRIES = 2
    attempt = 0
    last_error = ""
    code = ""
    explanation = ""
    usage = UsageInfo(prompt_tokens=0, completion_tokens=0, total_tokens=0)

    while attempt <= MAX_RETRIES:
        messages = list(base_messages)

        # Add error context for retry
        if last_error and attempt > 0:
            messages.insert(
                1,
                {
                    "role": "system",
                    "content": f"前一次代码验证失败：{last_error}。请修复并返回完整代码。",
                },
            )

        try:
            if attempt == 0:
                # First attempt: generate new code
                completion = openai_client.create_chat_completion(
                    messages,
                    model,
                    response_format={"type": "json_object"},
                    temperature=0.3,
                )
                content, usage = _extract_completion_content(completion)
                logger.debug(f"LLM response: {content[:200]}...")

                try:
                    explanation, code = _parse_llm_json(content)
                except json.JSONDecodeError as e:
                    logger.error(f"JSON parse error: {e}")
                    last_error = f"Invalid JSON response: {e}"
                    attempt += 1
                    continue
            else:
                # Retry: use fix prompt
                fix_messages = prompt_builder.build_fix_messages(code, last_error)
                fixed_code = openai_client.generate_fixed_code(code, last_error, fix_messages, model)
                code = sanitize_code(fixed_code)

        except TimeoutError:
            error = ErrorResponse(code="OPENAI_TIMEOUT", message="OpenAI request timeout")
            return JSONResponse(status_code=504, content=error.model_dump())
        except Exception as e:
            logger.error(f"LLM call failed: {e}")
            error = ErrorResponse(code="LLM_ERROR", message=str(e))
            return JSONResponse(status_code=500, content=error.model_dump())

        # Validate code
        if code:
            validation = validate_code(code)
            if not validation.is_valid:
                last_error = validation.error or "Code validation failed"
                logger.warning(f"Validation failed (attempt {attempt + 1}): {last_error}")
                if attempt < MAX_RETRIES:
                    attempt += 1
                    continue
        else:
            # No code generated (might be a simple text response)
            pass

        # Success - return response
        response = ChatResponse(
            message=AssistantMessage(content=explanation, code=code if code else None),
            usage=usage,
            style=style,
        )
        return SuccessResponse(data=response.model_dump())

    # All retries failed
    logger.error(f"All retries failed. Last error: {last_error}")
    error = ErrorResponse(
        code="CODE_GENERATION_FAILED",
        message=_get_friendly_error(),
        details={"technical_error": last_error},
    )
    return JSONResponse(status_code=422, content=error.model_dump())
