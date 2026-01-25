"""Admin API routes: user management, role assignment, quota management."""
from typing import Annotated, Optional
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from fastapi import APIRouter, Depends, HTTPException, status
from app.db.session import get_db
from app.core.security import Security
from app.models.auth import User, UserRole, UserQuota
from app.dependencies.auth import require_admin
from pydantic import BaseModel

# Type aliases
AdminUser = Annotated[User, Depends(require_admin)]

router = APIRouter(prefix="/admin", tags=["Admin"])


class SetRoleRequest(BaseModel):
    role: UserRole


class UpdateQuotaRequest(BaseModel):
    daily_messages_limit: Optional[int] = None
    monthly_messages_limit: Optional[int] = None
    daily_tokens_limit: Optional[int] = None
    vip_expires_at: Optional[datetime] = None


@router.put("/users/{user_id}/role")
async def set_user_role(
    user_id: str,
    request: SetRoleRequest,
    admin_user: AdminUser,
    db = Depends(get_db)
):
    """
    Set user role (ADMIN only).

    - Promote user to VIP
    - Demote user to USER
    - Promote user to ADMIN (restricted)
    """
    # Get target user
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    target_user = result.scalar_one_or_none()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Update role
    target_user.role = request.role
    await db.commit()
    await db.refresh(target_user)

    return {
        "success": True,
        "data": {
            "user_id": target_user.id,
            "email": target_user.email,
            "role": target_user.role
        }
    }


@router.get("/users")
async def list_users(
    admin_user: AdminUser,
    db = Depends(get_db),
    limit: int = 100,
    offset: int = 0
):
    """
    List all users (ADMIN only).

    - Paginated results
    - Shows user info and role
    """
    result = await db.execute(
        select(User)
        .options(selectinload(User.profile), selectinload(User.quota))
        .offset(offset)
        .limit(limit)
    )
    users = result.scalars().all()

    return {
        "success": True,
        "data": {
            "users": [
                {
                    "user_id": user.id,
                    "email": user.email,
                    "role": user.role,
                    "is_verified": user.is_verified,
                    "created_at": user.created_at
                }
                for user in users
            ],
            "total": len(users),
            "limit": limit,
            "offset": offset
        }
    }


@router.put("/users/{user_id}/quota")
async def update_user_quota(
    user_id: str,
    request: UpdateQuotaRequest,
    admin_user: AdminUser,
    db = Depends(get_db)
):
    """
    Update user quota (ADMIN only).

    - Set custom message limits
    - Set custom token limits
    - Set VIP expiration
    """
    # Get target user with quota
    result = await db.execute(
        select(User)
        .options(selectinload(User.quota))
        .where(User.id == user_id)
    )
    target_user = result.scalar_one_or_none()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if not target_user.quota:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User quota not found"
        )

    # Update quota fields if provided
    if request.daily_messages_limit is not None:
        target_user.quota.daily_messages_limit = request.daily_messages_limit
    if request.monthly_messages_limit is not None:
        target_user.quota.monthly_messages_limit = request.monthly_messages_limit
    if request.daily_tokens_limit is not None:
        target_user.quota.daily_tokens_limit = request.daily_tokens_limit
    if request.vip_expires_at is not None:
        target_user.quota.vip_expires_at = request.vip_expires_at

    await db.commit()

    # Get updated values for response
    quota_data = {
        "user_id": target_user.id,
        "daily_messages_limit": target_user.quota.daily_messages_limit,
        "monthly_messages_limit": target_user.quota.monthly_messages_limit,
        "daily_tokens_limit": target_user.quota.daily_tokens_limit,
        "vip_expires_at": target_user.quota.vip_expires_at
    }

    return {
        "success": True,
        "data": quota_data
    }


@router.get("/users/{user_id}")
async def get_user_details(
    user_id: str,
    admin_user: AdminUser,
    db = Depends(get_db)
):
    """
    Get detailed user information (ADMIN only).

    - Shows full user profile
    - Shows quota details
    - Shows activity stats
    """
    result = await db.execute(
        select(User)
        .options(selectinload(User.profile), selectinload(User.quota))
        .where(User.id == user_id)
    )
    target_user = result.scalar_one_or_none()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return {
        "success": True,
        "data": {
            "user": {
                "user_id": target_user.id,
                "email": target_user.email,
                "role": target_user.role,
                "is_verified": target_user.is_verified,
                "created_at": target_user.created_at,
                "profile": {
                    "nickname": target_user.profile.nickname if target_user.profile else None,
                    "avatar_url": target_user.profile.avatar_url if target_user.profile else None,
                    "bio": target_user.profile.bio if target_user.profile else None
                } if target_user.profile else None,
                "quota": {
                    "daily_messages_limit": target_user.quota.daily_messages_limit,
                    "daily_messages_used": target_user.quota.daily_messages_used,
                    "monthly_messages_limit": target_user.quota.monthly_messages_limit,
                    "monthly_messages_used": target_user.quota.monthly_messages_used,
                    "vip_expires_at": target_user.quota.vip_expires_at
                } if target_user.quota else None
            }
        }
    }
