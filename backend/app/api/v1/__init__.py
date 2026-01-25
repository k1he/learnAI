"""
API v1 Router
"""

from fastapi import APIRouter

from app.api.v1.chat import router as chat_router
from app.api.v1.auth import auth_router
from app.api.v1.admin import admin_router
from app.core.response import SuccessResponse

router = APIRouter()
router.include_router(chat_router)
router.include_router(auth_router)
router.include_router(admin_router)


@router.get("/")
async def root() -> SuccessResponse[dict[str, str]]:
    """API v1 root endpoint."""
    return SuccessResponse(data={"message": "ConceptCanvas API v1"})
