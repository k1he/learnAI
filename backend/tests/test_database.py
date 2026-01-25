"""Test database configuration."""
import pytest
from sqlalchemy.ext.asyncio import AsyncEngine
from app.db.base import Base
from app.db.database import engine


@pytest.mark.asyncio
async def test_database_engine_exists():
    """Test that database engine is initialized"""
    assert engine is not None
    assert engine.url is not None


@pytest.mark.asyncio
async def test_base_has_metadata():
    """Test that Base has metadata registry"""
    assert Base.metadata is not None
