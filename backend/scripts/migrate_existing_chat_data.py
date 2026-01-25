"""
Migrate existing chat messages to be associated with a system user.

IMPORTANT: This script is for FUTURE USE only.
Currently, the ConceptCanvas chat system is stateless and doesn't store messages in a database.
When a chat_messages table is created in the future, this script can be used to assign
unassociated messages to a system user.

Prerequisites:
    - Database must be initialized with: alembic upgrade head
    - A chat_messages table exists with a user_id column (future enhancement)
    - The auth system is set up with users table
    - Database connection is configured in .env

Usage:
    # First ensure database is initialized
    cd backend && alembic upgrade head

    # Then run migration
    python scripts/migrate_existing_chat_data.py
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.db.session import AsyncSessionLocal
from app.models.auth import User, UserRole, UserQuota, UserProfile
from app.core.security import Security
from datetime import datetime, timezone


async def create_system_user(db: AsyncSession) -> User:
    """Create or retrieve system user for orphaned chat messages."""
    result = await db.execute(
        select(User).where(User.email == "system@conceptcanvas.local")
    )
    system_user = result.scalar_one_or_none()

    if not system_user:
        print("Creating system user...")
        system_user = User(
            id="system_user_001",
            email="system@conceptcanvas.local",
            password_hash=Security.get_password_hash("system_password_not_used"),
            is_verified=True,
            role=UserRole.ADMIN,
            created_at=datetime.now(timezone.utc)
        )
        db.add(system_user)
        await db.commit()

        # Create profile
        profile = UserProfile(
            user_id=system_user.id,
            nickname="System",
            bio="System user for migrated chat data"
        )
        db.add(profile)

        # Create quota with unlimited limits
        quota = UserQuota(
            user_id=system_user.id,
            daily_messages_limit=999999,
            monthly_messages_limit=999999,
            daily_tokens_limit=999999999
        )
        db.add(quota)

        await db.commit()
        print(f"System user created: {system_user.id}")
    else:
        print(f"System user already exists: {system_user.id}")

    return system_user


async def migrate_chat_messages(db: AsyncSession, system_user: User):
    """
    Migrate chat messages without user_id to system user.

    NOTE: This requires a chat_messages table with a user_id column.
    Currently commented out as the table doesn't exist yet.
    """
    # UNCOMMENT WHEN chat_messages TABLE EXISTS:

    # from app.models.chat import ChatMessage  # SQLAlchemy model, not Pydantic
    #
    # # Find all messages without user_id
    # result = await db.execute(
    #     select(ChatMessage).where(ChatMessage.user_id.is_(None))
    # )
    # messages = result.scalars().all()
    #
    # if not messages:
    #     print("No unassociated messages found.")
    #     return
    #
    # print(f"Found {len(messages)} unassociated messages")
    #
    # # Update messages in batches
    # count = 0
    # for message in messages:
    #     message.user_id = system_user.id
    #     count += 1
    #     if count % 100 == 0:
    #         await db.commit()
    #         print(f"Processed {count}/{len(messages)} messages...")
    #
    # await db.commit()
    # print(f"Migration complete! Migrated {count} messages to system user.")

    print("NOTE: chat_messages table migration is not yet implemented.")
    print("This script is a placeholder for future use.")


async def main():
    """Run migration."""
    print("=" * 60)
    print("Chat Messages Migration Script")
    print("=" * 60)
    print()

    async with AsyncSessionLocal() as db:
        try:
            system_user = await create_system_user(db)
            await migrate_chat_messages(db, system_user)
            print()
            print("Migration process complete!")
        except Exception as e:
            print(f"ERROR: Migration failed - {e}")
            raise


if __name__ == "__main__":
    asyncio.run(main())
