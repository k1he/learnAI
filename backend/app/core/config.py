from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Concept Canvas Backend"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # CORS - 允许的来源列表
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # LLM Configuration
    LLM_API_KEY: str = ""
    LLM_BASE_URL: str = "https://api.deepseek.com/v1"
    DEFAULT_MODEL: str = "deepseek-chat"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
