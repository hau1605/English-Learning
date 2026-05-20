from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_env: str = "development"
    log_level: str = "INFO"
    app_name: str = "English Learning Crawler"

    api_host: str = "0.0.0.0"
    api_port: int = 8000

    backend_api_url: str = "http://localhost:3001"
    backend_api_key: str = ""

    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "english_learning"
    db_user: str = "postgres"
    db_password: str = "postgres"

    redis_host: str = "localhost"
    redis_port: int = 6380
    redis_db: int = 0

    crawl_delay_min: float = 1.0
    crawl_delay_max: float = 3.0
    crawl_max_retries: int = 3
    crawl_timeout: int = 30
    crawl_concurrency: int = 5

    rate_limit_enabled: bool = True
    rate_limit_requests: int = 100
    rate_limit_period: int = 60

    playwright_browsers_path: str = "/ms-playwright"
    playwright_headless: bool = True

    data_dir: str = "/app/data"
    logs_dir: str = "/app/logs"
    crawl_output_dir: str = "/app/data/crawl_output"

    @property
    def database_url(self) -> str:
        return f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    @property
    def redis_url(self) -> str:
        return f"redis://{self.redis_host}:{self.redis_port}/{self.redis_db}"


@lru_cache
def get_settings() -> Settings:
    return Settings()
