"""
Authentication API routes: register, login, verify, reset password.
"""
from datetime import datetime, timedelta, timezone
from sqlalchemy import select

from fastapi import APIRouter, Depends, HTTPException, status
from app.db.session import get_db
from app.core.config import settings
from app.core.security import Security
from app.models.auth import (
    User, UserProfile, UserQuota, UserRole,
    RegisterRequest, LoginRequest, UserResponse, LoginResponse
)
from app.services.email_service import EmailService

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
