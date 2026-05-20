from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CrawlSource(BaseModel):
    id: Optional[int] = None
    name: str
    url: str
    source_type: str
    content_type: str
    requires_browser: bool = False
    rate_limit: float = 1.0
    headers: Optional[dict] = None
    is_active: bool = True
    last_crawled: Optional[datetime] = None
    total_crawled: int = 0
    success_rate: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class CrawlLog(BaseModel):
    id: Optional[int] = None
    source_id: int
    source_name: str
    job_id: str
    status: str
    items_crawled: int = 0
    items_added: int = 0
    items_updated: int = 0
    items_failed: int = 0
    error_log: str = ""
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_ms: int = 0


class CrawlStatistics(BaseModel):
    total_sources: int = 0
    total_crawled_items: int = 0
    total_added_today: int = 0
    total_failed_today: int = 0
    average_success_rate: float = 0.0
    sources_by_status: dict[str, int] = Field(default_factory=dict)
