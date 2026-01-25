"""add user_id to chat_messages (FUTURE USE - table doesn't exist yet)

Revision ID: 002_chat_user_assoc
Revises: c2e2f98535a0
Create Date: 2026-01-25 00:00:00.000000

Note: This migration is for future use when a chat_messages table is created.
      Currently, the chat system is stateless and doesn't store messages in the database.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002_chat_user_assoc'
down_revision: Union[str, None] = 'c2e2f98535a0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Add user_id column to chat_messages table.

    This migration assumes a chat_messages table exists with at least:
    - id (primary key)
    - created_at timestamp
    - message content/data fields
    """
    # Check if table exists before attempting migration
    # op.add_column(
    #     'chat_messages',
    #     sa.Column('user_id', sa.String(), nullable=True)
    # )
    #
    # # Create index for user_id lookups
    # op.create_index(
    #     'ix_chat_messages_user_id',
    #     'chat_messages',
    #     ['user_id']
    # )
    #
    # # Optionally add foreign key constraint
    # op.create_foreign_key(
    #     'fk_chat_messages_user_id',
    #     'chat_messages',
    #     'users',
    #     ['user_id'],
    #     ['id'],
    #     ondelete='SET NULL'  # Keep messages if user is deleted
    # )

    # COMMENTED OUT: Uncomment when chat_messages table is created
    pass


def downgrade() -> None:
    """Remove user_id column from chat_messages table."""
    # op.drop_constraint('fk_chat_messages_user_id', 'chat_messages', type_='foreignkey')
    # op.drop_index('ix_chat_messages_user_id', table_name='chat_messages')
    # op.drop_column('chat_messages', 'user_id')

    # COMMENTED OUT: Uncomment when chat_messages table is created
    pass
