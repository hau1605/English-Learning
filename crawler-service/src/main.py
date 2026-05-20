import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional
import structlog

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from config import get_settings
from src.services import crawler_service
from src.services.file_storage import file_storage_service
from src.models import CrawlResult

settings = get_settings()
structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
)
logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("app_startup", app_name=settings.app_name, env=settings.app_env)
    yield
    logger.info("app_shutdown", app_name=settings.app_name)


app = FastAPI(
    title="English Learning Platform - Crawler Service",
    description="Crawl vocabulary, grammar, and quiz data from various sources",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CrawlVocabularyRequest(BaseModel):
    words: list[str] = Field(..., min_length=1, max_length=1000)
    source: str = Field(default="free_dictionary")
    push_to_backend: bool = Field(default=True)


class CrawlGrammarRequest(BaseModel):
    categories: Optional[list[str]] = None
    push_to_backend: bool = Field(default=True)


class CrawlWordRequest(BaseModel):
    word: str = Field(..., min_length=1, max_length=100)
    source: str = Field(default="free_dictionary")


class CrawlByLetterRequest(BaseModel):
    letter: str = Field(..., min_length=1, max_length=1)
    limit: int = Field(default=100, ge=1, le=500)
    push_to_backend: bool = Field(default=True)


class CrawlFileRequest(BaseModel):
    batch_size: int = Field(default=100, ge=10, le=500)
    source: str = Field(default="free_dictionary")
    push_to_backend: bool = Field(default=True)


class JobResponse(BaseModel):
    job_id: str
    status: str
    message: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: datetime


class StatsResponse(BaseModel):
    active_jobs: int
    total_crawled_today: int
    success_rate: float


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        service=settings.app_name,
        version="1.0.0",
        timestamp=datetime.utcnow(),
    )


@app.get("/stats", response_model=StatsResponse)
async def get_stats():
    active_jobs = crawler_service.list_active_jobs()
    return StatsResponse(
        active_jobs=len(active_jobs),
        total_crawled_today=sum(j.items_crawled for j in active_jobs),
        success_rate=0.95,
    )


@app.post("/api/v1/crawl/vocabulary", response_model=JobResponse)
async def crawl_vocabulary(
    request: CrawlVocabularyRequest,
):
    result = await crawler_service.crawl_vocabulary(
        request.words,
        request.source,
        request.push_to_backend,
    )

    job_id = result.source if hasattr(result, 'source') else str(uuid.uuid4())

    logger.info("crawl_job_completed", job_id=job_id, words_count=len(request.words), items=result.items_added)

    return JobResponse(
        job_id=job_id,
        status="completed" if result.success else "failed",
        message=f"Crawl completed: {result.items_added} added, {result.items_updated} updated, {result.items_failed} failed",
    )


@app.post("/api/v1/crawl/vocabulary/sync", response_model=CrawlResult)
async def crawl_vocabulary_sync(request: CrawlVocabularyRequest):
    try:
        result = await crawler_service.crawl_vocabulary(
            request.words,
            request.source,
            request.push_to_backend,
        )
        return result
    except Exception as e:
        logger.error("crawl_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/crawl/word", response_model=Optional[dict])
async def crawl_single_word(request: CrawlWordRequest):
    try:
        item = await crawler_service.crawl_word_definition(
            request.word,
            request.source,
        )
        if item:
            return item.model_dump(mode="json")
        raise HTTPException(status_code=404, detail="Word not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("crawl_failed", word=request.word, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/crawl/by-letter", response_model=JobResponse)
async def crawl_by_letter(request: CrawlByLetterRequest):
    try:
        result = await crawler_service.crawl_by_letter(
            request.letter,
            request.limit,
            request.push_to_backend,
        )
        return JobResponse(
            job_id=result.source or str(uuid.uuid4()),
            status="completed" if result.success else "failed",
            message=f"Crawled {result.items_added} words starting with '{request.letter}'",
        )
    except Exception as e:
        logger.error("crawl_by_letter_failed", letter=request.letter, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/crawl/file", response_model=JobResponse)
async def crawl_from_file(request: CrawlFileRequest):
    """
    Crawl vocabulary from uploaded word list file.
    The file should be located at /data/words.txt (mounted volume).
    Each line contains one word.
    """
    try:
        result = await crawler_service.crawl_from_file(
            request.batch_size,
            request.source,
            request.push_to_backend,
        )
        return JobResponse(
            job_id=str(uuid.uuid4()),
            status="completed" if result.success else "failed",
            message=f"Crawl completed: {result.items_added} added, {result.items_failed} failed, took {result.duration_ms}ms",
        )
    except FileNotFoundError as e:
            raise HTTPException(status_code=404, detail="Word file not found. Please mount your words.txt to /app/data/words.txt")
    except Exception as e:
        logger.error("crawl_from_file_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/crawl/grammar", response_model=JobResponse)
async def crawl_grammar(
    request: CrawlGrammarRequest,
):
    categories = request.categories or ["basic", "intermediate", "advanced"]

    result = await crawler_service.crawl_grammar(
        categories,
        request.push_to_backend,
    )

    job_id = result.source if hasattr(result, 'source') else str(uuid.uuid4())

    logger.info("grammar_crawl_completed", job_id=job_id, categories=categories, lessons=result.items_added)

    return JobResponse(
        job_id=job_id,
        status="completed" if result.success else "failed",
        message=f"Grammar crawl completed: {result.items_added} lessons added",
    )


@app.post("/api/v1/crawl/grammar/sync", response_model=CrawlResult)
async def crawl_grammar_sync(request: CrawlGrammarRequest):
    try:
        result = await crawler_service.crawl_grammar(
            request.categories,
            request.push_to_backend,
        )
        return result
    except Exception as e:
        logger.error("crawl_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/jobs/{job_id}")
async def get_job_status(job_id: str):
    job = crawler_service.get_job_status(job_id)
    if job:
        return job.model_dump(mode="json")
    return {"job_id": job_id, "status": "not_found"}


@app.get("/api/v1/jobs")
async def list_jobs():
    jobs = crawler_service.list_active_jobs()
    return {"jobs": [j.model_dump(mode="json") for j in jobs], "count": len(jobs)}


@app.get("/api/v1/sources")
async def list_sources():
    from config import SOURCES, GRAMMAR_SOURCES

    all_sources = []
    for key, source in {**SOURCES, **GRAMMAR_SOURCES}.items():
        all_sources.append({
            "key": key,
            "name": source.name,
            "type": source.source_type.value,
            "content_type": source.content_type.value,
            "requires_browser": source.requires_browser,
            "rate_limit": source.rate_limit,
        })

    return {"sources": all_sources, "count": len(all_sources)}


# File storage endpoints
@app.get("/api/v1/files", response_model=dict)
async def list_crawl_files(content_type: str = Query(None, description="Filter by content type (vocabulary/grammar)")):
    """List all crawl output files."""
    try:
        files = file_storage_service.list_crawl_files(content_type)
        return {
            "files": files,
            "count": len(files),
        }
    except Exception as e:
        logger.error("list_crawl_files_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/files/{filename}", response_class=JSONResponse)
async def get_crawl_file(filename: str):
    """Get contents of a specific crawl file."""
    try:
        data = file_storage_service.read_crawl_file(filename)
        if data is None:
            raise HTTPException(status_code=404, detail="File not found")
        return data
    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_crawl_file_failed", filename=filename, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.app_env == "development",
    )
