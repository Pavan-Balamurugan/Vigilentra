"""Application configuration loaded from environment variables."""

import os
from pydantic_settings import BaseSettings
from typing import Optional


def _find_env_file() -> str:
    """Locate the .env file.

    Checks the current working directory first (project root when running
    uvicorn backend.main:app), then checks inside the backend/ directory
    relative to cwd, then checks next to this config.py file itself.
    """
    # 1. Check cwd (project root)
    if os.path.isfile(".env"):
        return os.path.abspath(".env")

    # 2. Check cwd/backend/.env (common placement)
    candidate = os.path.join("backend", ".env")
    if os.path.isfile(candidate):
        return os.path.abspath(candidate)

    # 3. Check next to this file
    here = os.path.dirname(os.path.abspath(__file__))
    candidate = os.path.join(here, ".env")
    if os.path.isfile(candidate):
        return candidate

    # Fallback
    return ".env"


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

    model_config = {
        "env_file": _find_env_file(),
        "env_file_encoding": "utf-8",
    }


settings = Settings()

# Startup diagnostic — prints to uvicorn console so you can confirm keys loaded
def _check_keys():
    vt = "LOADED" if settings.VIRUSTOTAL_API_KEY else "MISSING"
    sb = "LOADED" if settings.SAFE_BROWSING_API_KEY else "MISSING"
    jwt = "SET" if settings.JWT_SECRET != "change-me-in-production" else "DEFAULT (change this!)"
    env_path = _find_env_file()
    print(f"[Vigilentra Config] .env path: {env_path}")
    print(f"[Vigilentra Config] VirusTotal API Key: {vt}")
    print(f"[Vigilentra Config] Safe Browsing API Key: {sb}")
    print(f"[Vigilentra Config] JWT Secret: {jwt}")

_check_keys()