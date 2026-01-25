"""
Application configuration using Pydantic Settings.
"""
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    # App
    app_name: str = "ConceptCanvas API"
    debug: bool = False

    # OpenAI
    openai_api_key: str
    openai_base_url: Optional[str] = None
    default_model: str = "gpt-4o"

    # Vector Database (optional)
    pinecone_api_key: str = ""
    pinecone_environment: str = ""
    pinecone_index_name: str = "concept-canvas"

    # Network
    request_timeout: int = 60  # seconds
    max_retries: int = 3

    # CORS
    allowed_origins: list[str] = ["*"]

    # Database
    database_url: str = "sqlite+aiosqlite:///:memory:"

    # JWT
    secret_key: str = "dev-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiry_days: int = 7

    # Email/SMTP
    smtp_server: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_from_name: str = "ConceptCanvas"

    # Email verification
    verification_code_expire_minutes: int = 15
    password_reset_expire_hours: int = 1

    # Default user quotas
    daily_messages_limit: int = 50
    monthly_messages_limit: int = 1000
    daily_tokens_limit: int = 50000

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
