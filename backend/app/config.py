import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    gemini_api_key: str = ""
    environment: str = "development"
    data_dir: str = str(BASE_DIR / "data")

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env.local"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
