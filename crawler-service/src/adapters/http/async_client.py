import asyncio
import random
from typing import Optional
import httpx
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)
import structlog

from config import get_settings

logger = structlog.get_logger()


class RateLimitedClient:
    def __init__(self):
        self.settings = get_settings()
        self._last_request_time: dict[str, float] = {}
        self._lock = asyncio.Lock()

    def _get_delay(self, source_key: str, rate_limit: float) -> float:
        current_time = asyncio.get_event_loop().time()
        last_time = self._last_request_time.get(source_key, 0)
        min_delay = max(0.5, rate_limit)
        elapsed = current_time - last_time
        if elapsed < min_delay:
            return min_delay - elapsed + random.uniform(0.1, 0.5)
        return random.uniform(
            self.settings.crawl_delay_min, self.settings.crawl_delay_max
        )

    async def _wait_for_rate_limit(self, source_key: str, rate_limit: float) -> None:
        delay = self._get_delay(source_key, rate_limit)
        if delay > 0:
            await asyncio.sleep(delay)
        self._last_request_time[source_key] = asyncio.get_event_loop().time()


class AsyncHTTPClient:
    def __init__(self):
        self.settings = get_settings()
        self.rate_limiter = RateLimitedClient()
        self._client: Optional[httpx.AsyncClient] = None

    async def __aenter__(self) -> "AsyncHTTPClient":
        limits = httpx.Limits(
            max_keepalive_connections=self.settings.crawl_concurrency,
            max_connections=self.settings.crawl_concurrency + 10,
        )
        self._client = httpx.AsyncClient(
            timeout=httpx.Timeout(self.settings.crawl_timeout),
            limits=limits,
            follow_redirects=True,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            },
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        if self._client:
            await self._client.aclose()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.NetworkError)),
    )
    async def get(
        self,
        url: str,
        source_key: str = "default",
        rate_limit: float = 1.0,
        headers: Optional[dict] = None,
        params: Optional[dict] = None,
    ) -> httpx.Response:
        if not self._client:
            raise RuntimeError("Client not initialized. Use async context manager.")

        await self.rate_limiter._wait_for_rate_limit(source_key, rate_limit)

        merged_headers = {"User-Agent": "Mozilla/5.0 (compatible; EnglishCrawler/1.0)"}
        if headers:
            merged_headers.update(headers)

        logger.debug("http_request", url=url, source=source_key)
        response = await self._client.get(
            url, headers=merged_headers, params=params, follow_redirects=True
        )
        response.raise_for_status()
        logger.debug("http_response", url=url, status=response.status_code)
        return response

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.NetworkError)),
    )
    async def post(
        self,
        url: str,
        source_key: str = "default",
        rate_limit: float = 1.0,
        headers: Optional[dict] = None,
        json: Optional[dict] = None,
        data: Optional[dict] = None,
    ) -> httpx.Response:
        if not self._client:
            raise RuntimeError("Client not initialized. Use async context manager.")

        await self.rate_limiter._wait_for_rate_limit(source_key, rate_limit)

        merged_headers = {"User-Agent": "Mozilla/5.0 (compatible; EnglishCrawler/1.0)"}
        if headers:
            merged_headers.update(headers)

        logger.debug("http_post", url=url, source=source_key)
        response = await self._client.post(
            url, headers=merged_headers, json=json, data=data
        )
        response.raise_for_status()
        logger.debug("http_response", url=url, status=response.status_code)
        return response


async def get_http_client() -> AsyncHTTPClient:
    return AsyncHTTPClient()
