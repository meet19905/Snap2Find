"""Application configuration using Pydantic Settings.

Loads values from environment variables and .env file.
Reference: https://docs.pydantic.dev/latest/concepts/pydantic_settings/
"""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration for the Snap2Find unified backend."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Server
    port: int = 5050

    # File storage
    upload_dir: str = "uploads"

    # Database
    db_path: str = "snap2find.db"

    # AI verification thresholds
    verify_similarity_threshold: float = 0.55
    lost_duplicate_threshold: float = 0.95


# Singleton instance
settings = Settings()

# Resolve upload directory to an absolute path relative to the ai-service root
UPLOAD_DIR = Path(__file__).resolve().parent.parent / settings.upload_dir
UPLOAD_DIR.mkdir(exist_ok=True)

# Resolve database path relative to the ai-service root
DB_PATH = Path(__file__).resolve().parent.parent / settings.db_path
