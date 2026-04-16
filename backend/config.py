"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Central configuration for the Vigilentra backend.

    All values are read from a .env file or environment variables.
    """

    DATABASE_URL: str = "sqlite:///./vigilentra.db"
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60

    VIRUSTOTAL_API_KEY: Optional[str] = None
    SAFE_BROWSING_API_KEY: Optional[str] = None

    RATE_LIMIT_PER_MINUTE: int = 20

    CORS_ORIGINS: str = "*"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
