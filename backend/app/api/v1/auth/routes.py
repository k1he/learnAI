"""
Authentication API routes: register, login, verify, reset password.
"""
from typing import Annotated
from datetime import datetime, timedelta, timezone
from sqlalchemy import select

from fastapi import APIRouter, Depends, HTTPException, status
from app.db.session import get_db
from app.core.config import settings
from app.core.security import Security
from app.models.auth import (
    User, UserProfile, UserQuota, UserRole,
    RegisterRequest, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest,
    UpdateProfileRequest, UserResponse, LoginResponse, QuotaResponse
)
from app.services.email_service import EmailService
from app.dependencies.auth import get_current_user

# Type aliases for dependency injection
CurrentUser = Annotated[User, Depends(get_current_user)]

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    db = Depends(get_db)
):
    """
    Register a new user account.

    - Sends verification email with 6-digit code
    - Creates default profile and quota
    - Password must be at least 8 characters
    """
    # Check if email already exists
    result = await db.execute(
        select(User).where(User.email == request.email)
    )
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Generate verification code
    verification_code = Security.generate_verification_code()
    verification_expires = datetime.now(timezone.utc) + timedelta(
        minutes=settings.verification_code_expire_minutes
    )

    # Create user
    user = User(
        email=request.email,
        password_hash=Security.get_password_hash(request.password),
        is_verified=False,
        role=UserRole.USER,
        verification_code=verification_code,
        verification_expires_at=verification_expires
    )
    db.add(user)
    await db.flush()  # Get user.id

    # Create default profile
    profile = UserProfile(
        user_id=user.id,
        nickname=request.email.split("@")[0]
    )
    db.add(profile)

    # Create default quota
    quota = UserQuota(
        user_id=user.id,
        daily_messages_limit=settings.daily_messages_limit,
        monthly_messages_limit=settings.monthly_messages_limit,
        daily_tokens_limit=settings.daily_tokens_limit
    )
    db.add(quota)

    await db.commit()
    await db.refresh(user)

    # Send verification email
    await EmailService.send_verification_email(
        email=user.email,
        code=verification_code
    )

    return {
        "success": True,
        "data": UserResponse.from_db_model(user).model_dump()
    }


@router.post("/login")
async def login(
    request: LoginRequest,
    db = Depends(get_db)
):
    """
    Authenticate user and return JWT token.

    - Validates email and password
    - Returns access token with user info
    - Email verification recommended but not enforced
    """
    from sqlalchemy.orm import selectinload

    # Find user by email with profile and quota loaded
    result = await db.execute(
        select(User)
        .options(selectinload(User.profile), selectinload(User.quota))
        .where(User.email == request.email)
    )
    user = result.scalar_one_or_none()

    # Verify password
    if not user or not Security.verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Create access token
    access_token = Security.create_access_token(
        data={"sub": user.id, "email": user.email}
    )

    return {
        "success": True,
        "data": {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.jwt_expiry_days * 24 * 60 * 60,  # Convert to seconds
            "user": UserResponse.from_db_model(user).model_dump()
        }
    }


@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    db = Depends(get_db)
):
    """
    Request password reset email.

    - Sends reset token to user's email
    - Always returns 200 to avoid email enumeration
    - Token expires after configured hours
    """
    result = await db.execute(
        select(User).where(User.email == request.email)
    )
    user = result.scalar_one_or_none()

    if user:
        # Generate reset token
        reset_token = Security.generate_reset_token()
        reset_expires = datetime.now(timezone.utc) + timedelta(
            hours=settings.password_reset_expire_hours
        )

        user.reset_token = reset_token
        user.reset_token_expires_at = reset_expires
        await db.commit()

        # Send reset email
        await EmailService.send_password_reset_email(
            email=user.email,
            token=reset_token
        )

    # Always return success to avoid email enumeration
    return {
        "success": True,
        "message": "If the email exists, a password reset link has been sent"
    }


@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    db = Depends(get_db)
):
    """
    Reset password with valid token.

    - Token must be valid and not expired
    - Password must meet requirements
    - Invalidates reset token after use
    """
    result = await db.execute(
        select(User).where(User.reset_token == request.token)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token"
        )

    # Check if token expired
    if (
        user.reset_token_expires_at is None or
        user.reset_token_expires_at < datetime.now(timezone.utc)
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token expired"
        )

    # Update password
    user.password_hash = Security.get_password_hash(request.new_password)
    user.reset_token = None
    user.reset_token_expires_at = None

    await db.commit()
    await db.refresh(user)

    return {
        "success": True,
        "message": "Password reset successfully"
    }


@router.put("/profile")
async def update_profile(
    request: UpdateProfileRequest,
    current_user: CurrentUser,
    db = Depends(get_db)
):
    """
    Update user profile information.

    - Update nickname, avatar URL, and bio
    - Partial updates allowed (omit fields to keep current values)
    - Requires authentication
    """
    from sqlalchemy.orm import selectinload

    # Reload user with profile in current db session
    result = await db.execute(
        select(User)
        .options(selectinload(User.profile))
        .where(User.id == current_user.id)
    )
    user = result.scalar_one()

    # Get or create profile
    if not user.profile:
        profile = UserProfile(user_id=user.id, nickname=user.email.split("@")[0])
        db.add(profile)
        await db.flush()  # Flush to get the profile ID
        # Manually set the relationship
        user.profile = profile

    # Update fields if provided
    if request.nickname is not None:
        user.profile.nickname = request.nickname
    if request.avatar_url is not None:
        user.profile.avatar_url = request.avatar_url
    if request.bio is not None:
        user.profile.bio = request.bio

    await db.commit()

    # Get final values for response
    result_nickname = user.profile.nickname
    result_avatar = user.profile.avatar_url
    result_bio = user.profile.bio

    return {
        "success": True,
        "data": {"profile": {
            "nickname": result_nickname,
            "avatar_url": result_avatar,
            "bio": result_bio
        }}
    }


@router.get("/quota")
async def get_quota(
    current_user: CurrentUser,
    db = Depends(get_db)
):
    """
    Get current user's quota information.

    - Shows message and token usage
    - Displays remaining quota
    - Shows VIP status and expiration
    """
    from sqlalchemy.orm import selectinload

    # Reload user with quota in current db session
    result = await db.execute(
        select(User)
        .options(selectinload(User.quota))
        .where(User.id == current_user.id)
    )
    user = result.scalar_one()

    if not user.quota:
        # Create quota if not exists
        quota = UserQuota(
            user_id=user.id,
            daily_messages_limit=settings.daily_messages_limit,
            monthly_messages_limit=settings.monthly_messages_limit,
            daily_tokens_limit=settings.daily_tokens_limit
        )
        db.add(quota)
        await db.flush()
        # Manually set the relationship
        user.quota = quota

    now = datetime.now(timezone.utc)
    is_vip = (
        user.role == UserRole.VIP and
        (user.quota.vip_expires_at is None or
         user.quota.vip_expires_at > now)
    )

    # Get values before commit for response
    quota_data = {
        "daily_messages_limit": user.quota.daily_messages_limit,
        "daily_messages_used": user.quota.daily_messages_used,
        "daily_messages_remaining": max(
            0,
            user.quota.daily_messages_limit - user.quota.daily_messages_used
        ),
        "daily_messages_reset_at": user.quota.daily_messages_reset_at,
        "monthly_messages_limit": user.quota.monthly_messages_limit,
        "monthly_messages_used": user.quota.monthly_messages_used,
        "monthly_messages_remaining": max(
            0,
            user.quota.monthly_messages_limit - user.quota.monthly_messages_used
        ),
        "monthly_messages_reset_at": user.quota.monthly_messages_reset_at,
        "daily_tokens_limit": user.quota.daily_tokens_limit,
        "daily_tokens_used": user.quota.daily_tokens_used,
        "daily_tokens_remaining": max(
            0,
            user.quota.daily_tokens_limit - user.quota.daily_tokens_used
        ),
        "daily_tokens_reset_at": user.quota.daily_tokens_reset_at,
        "is_vip": is_vip,
        "vip_expires_at": user.quota.vip_expires_at
    }

    await db.commit()

    return {
        "success": True,
        "data": quota_data
    }


@router.delete("/account")
async def delete_account(
    current_user: CurrentUser,
    db = Depends(get_db)
):
    """
    Delete user account and all associated data.

    - This action is irreversible
    - Deletes user profile and quota
    - Requires authentication
    """
    # SQLAlchemy cascade will delete profile and quota
    await db.delete(current_user)
    await db.commit()

    return {
        "success": True,
        "message": "Account deleted successfully"
    }
