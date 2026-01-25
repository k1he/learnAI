"""Health check endpoint."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter

from app.core.config import settings
from app.core.response import SuccessResponse

router = APIRouter()


@router.get("/health")
async def health_check() -> SuccessResponse[dict[str, Any]]:
    openai_status = "connected" if settings.openai_api_key else "disconnected"
    return SuccessResponse(
        data={
            "status": "healthy",
            "version": "1.0.0",
            "dependencies": {
                "openai": openai_status,
            },
        }
    )
