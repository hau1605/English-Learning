from typing import Optional
import httpx
import structlog

from config import get_settings

logger = structlog.get_logger()


class BackendAPIClient:
    def __init__(self):
        self.settings = get_settings()
        self._client: Optional[httpx.AsyncClient] = None

    def _get_client(self) -> httpx.AsyncClient:
        if not self._client:
            self._client = httpx.AsyncClient(
                base_url=self.settings.backend_api_url,
                timeout=30.0,
                headers={
                    "Authorization": f"Bearer {self.settings.backend_api_key}",
                    "Content-Type": "application/json",
                },
            )
        return self._client

    async def post_vocabulary(self, items: list[dict]) -> dict:
        client = self._get_client()
        try:
            response = await client.post("/api/crawler/vocabulary", json={"items": items})
            response.raise_for_status()
            logger.info("vocabulary_pushed", count=len(items))
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error("backend_api_error", status=e.response.status_code)
            raise

    async def post_topics(self, topics: list[dict]) -> dict:
        client = self._get_client()
        try:
            response = await client.post("/api/crawler/topics", json={"topics": topics})
            response.raise_for_status()
            logger.info("topics_pushed", count=len(topics))
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error("backend_api_error", status=e.response.status_code)
            raise

    async def post_grammar(self, lessons: list[dict]) -> dict:
        client = self._get_client()
        try:
            response = await client.post("/api/crawler/grammar", json={"lessons": lessons})
            response.raise_for_status()
            logger.info("grammar_pushed", count=len(lessons))
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error("backend_api_error", status=e.response.status_code)
            raise

    async def get_job_status(self, job_id: str) -> dict:
        client = self._get_client()
        try:
            response = await client.get(f"/api/crawler/jobs/{job_id}")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error("backend_api_error", status=e.response.status_code)
            raise

    async def close(self) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None


backend_client = BackendAPIClient()
