"""Database engine configuration."""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine
from app.core.config import settings


database_url = getattr(settings, 'database_url', 'sqlite+aiosqlite:///:memory:')

engine: AsyncEngine = create_async_engine(
    database_url,
    echo=settings.debug,
    future=True
)
