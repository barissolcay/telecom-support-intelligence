from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "TelcoAssist API"
    app_env: str = "development"
    log_level: str = "INFO"
    storage_backend: Literal["memory", "database"] = "memory"
    database_url: str = "sqlite:///./telcoassist.db"
    qdrant_url: str = "http://localhost:6333"
    llm_provider: str = "disabled"
    llm_api_key: str = ""
    retrieval_min_score: float = 0.18
    max_upload_mb: int = 10

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
