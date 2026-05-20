import structlog
from abc import ABC, abstractmethod
from typing import Optional

from src.models import VocabularyItem, GrammarLesson, QuizItem, CrawlResult
from src.adapters import AsyncHTTPClient

logger = structlog.get_logger()


class BaseExtractor(ABC):
    def __init__(self, source_name: str):
        self.source_name = source_name
        self.http_client: Optional[AsyncHTTPClient] = None

    async def initialize(self) -> None:
        self.http_client = AsyncHTTPClient()
        await self.http_client.__aenter__()

    async def cleanup(self) -> None:
        if self.http_client:
            await self.http_client.__aexit__(None, None, None)

    @abstractmethod
    async def extract(self, **kwargs) -> list[VocabularyItem | GrammarLesson | QuizItem]:
        pass

    def _create_result(
        self,
        items: list[VocabularyItem | GrammarLesson | QuizItem],
        items_added: int = 0,
        items_updated: int = 0,
        items_failed: int = 0,
        errors: Optional[list[str]] = None,
    ) -> CrawlResult:
        return CrawlResult(
            success=items_failed == 0,
            source=self.source_name,
            items=items,
            items_added=items_added,
            items_updated=items_updated,
            items_failed=items_failed,
            errors=errors or [],
        )
