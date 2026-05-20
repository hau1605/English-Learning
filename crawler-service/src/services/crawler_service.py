import time
import uuid
import re
import asyncio
from typing import Optional, Any
import structlog

from src.models import (
    VocabularyItem,
    GrammarLesson,
    CrawlResult,
    CrawlJob,
    CrawlStatus,
)
from src.extractors import FreeDictExtractor, FreeDictAPIExtractor, OxfordExtractor, WiktionaryExtractor, GrammarExtractor
from src.adapters.storage import backend_client
from src.services.file_storage import file_storage_service

logger = structlog.get_logger()


def to_camel_case(snake_str: str) -> str:
    """Convert snake_case to camelCase."""
    components = snake_str.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])


def convert_keys_to_camel(obj: Any) -> Any:
    """Recursively convert all dictionary keys from snake_case to camelCase."""
    if isinstance(obj, dict):
        return {to_camel_case(k): convert_keys_to_camel(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_keys_to_camel(item) for item in obj]
    return obj


def model_to_camel_case(item: VocabularyItem | GrammarLesson) -> dict:
    """Convert a Pydantic model to dict with camelCase keys."""
    return convert_keys_to_camel(item.model_dump(mode="json"))


class CrawlerService:
    def __init__(self):
        self.free_dict_extractor = FreeDictExtractor()
        self.free_dict_api_extractor = FreeDictAPIExtractor()
        self.oxford_extractor = OxfordExtractor()
        self.wiktionary_extractor = WiktionaryExtractor()
        self.grammar_extractor = GrammarExtractor()
        self._active_jobs: dict[str, CrawlJob] = {}

    async def crawl_vocabulary(
        self,
        words: list[str],
        source: str = "free_dictionary",
        push_to_backend: bool = True,
    ) -> CrawlResult:
        job_id = str(uuid.uuid4())
        start_time = time.time()

        job = CrawlJob(
            job_id=job_id,
            source=source,
            content_type="vocabulary",
            status=CrawlStatus.IN_PROGRESS,
            words=words,
            total_items=len(words),
            started_at=time.time(),
        )
        self._active_jobs[job_id] = job

        logger.info("crawl_started", job_id=job_id, words_count=len(words), source=source)

        try:
            if source == "free_dictionary":
                items = await self.free_dict_extractor.extract_batch(words)
            elif source == "free_dict_api":
                items = await self.free_dict_api_extractor.extract_batch(words)
            elif source == "oxford":
                items = []
                for word in words:
                    extracted = await self.oxford_extractor.extract(word)
                    items.extend(extracted)
            elif source == "wiktionary":
                items = await self.wiktionary_extractor.extract_batch(words)
            else:
                items = await self.free_dict_extractor.extract_batch(words)

            items_added = 0
            items_updated = 0
            errors = []

            # Always save to file regardless of push_to_backend setting
            try:
                vocab_dicts = [model_to_camel_case(item) for item in items]
                saved_path = await file_storage_service.save_vocabulary(
                    items=vocab_dicts,
                    source=source,
                    metadata={
                        "words_count": len(words),
                        "job_id": job_id,
                    },
                )
                if saved_path:
                    logger.info("vocabulary_saved_to_file", filepath=saved_path)
            except Exception as e:
                logger.error("file_storage_failed", error=str(e))

            if push_to_backend and items:
                try:
                    result = await backend_client.post_vocabulary(vocab_dicts)
                    items_added = result.get("itemsAdded", 0)
                    items_updated = result.get("itemsUpdated", 0)
                    logger.info("pushed_to_backend", added=items_added, updated=items_updated)
                except Exception as e:
                    logger.error("backend_push_failed", error=str(e))
                    errors.append(f"Backend push failed: {str(e)}")

            duration_ms = int((time.time() - start_time) * 1000)

            job.status = CrawlStatus.COMPLETED
            job.items_crawled = len(items)
            job.items_added = items_added
            job.items_updated = items_updated
            job.items_failed = len(words) - len(items)
            job.completed_at = time.time()

            logger.info(
                "crawl_completed",
                job_id=job_id,
                items=len(items),
                added=items_added,
                duration_ms=duration_ms,
            )

            return CrawlResult(
                success=True,
                source=source,
                items=items,
                items_added=items_added,
                items_updated=items_updated,
                items_failed=len(words) - len(items),
                errors=errors,
                duration_ms=duration_ms,
            )

        except Exception as e:
            logger.error("crawl_failed", job_id=job_id, error=str(e))
            job.status = CrawlStatus.FAILED
            job.error_log.append(str(e))

            return CrawlResult(
                success=False,
                source=source,
                items=[],
                errors=[str(e)],
                duration_ms=int((time.time() - start_time) * 1000),
            )

        finally:
            pass  # Don't cleanup after each request, let the service manage lifecycle

    async def crawl_grammar(
        self,
        categories: Optional[list[str]] = None,
        push_to_backend: bool = True,
    ) -> CrawlResult:
        job_id = str(uuid.uuid4())
        start_time = time.time()

        if categories is None:
            categories = ["basic", "intermediate", "advanced"]

        job = CrawlJob(
            job_id=job_id,
            source="english_grammar",
            content_type="grammar",
            status=CrawlStatus.IN_PROGRESS,
            total_items=len(categories),
            started_at=time.time(),
        )
        self._active_jobs[job_id] = job

        logger.info("grammar_crawl_started", job_id=job_id, categories=categories)

        try:
            all_lessons = []
            for category in categories:
                lessons = await self.grammar_extractor.extract(category)
                all_lessons.extend(lessons)

            items_added = 0
            items_updated = 0
            errors = []

            # Always save to file regardless of push_to_backend setting
            try:
                lesson_dicts = [model_to_camel_case(lesson) for lesson in all_lessons]
                saved_path = await file_storage_service.save_grammar(
                    items=lesson_dicts,
                    source="english_grammar",
                    metadata={
                        "categories": categories,
                        "job_id": job_id,
                    },
                )
                if saved_path:
                    logger.info("grammar_saved_to_file", filepath=saved_path)
            except Exception as e:
                logger.error("file_storage_failed", error=str(e))

            if push_to_backend and all_lessons:
                try:
                    result = await backend_client.post_grammar(lesson_dicts)
                    items_added = result.get("lessonsAdded", 0)
                    items_updated = result.get("lessonsUpdated", 0)
                except Exception as e:
                    logger.error("backend_push_failed", error=str(e))
                    errors.append(f"Backend push failed: {str(e)}")

            duration_ms = int((time.time() - start_time) * 1000)

            job.status = CrawlStatus.COMPLETED
            job.items_crawled = len(all_lessons)
            job.items_added = items_added
            job.items_updated = items_updated
            job.completed_at = time.time()

            logger.info("grammar_crawl_completed", job_id=job_id, lessons=len(all_lessons))

            return CrawlResult(
                success=True,
                source="english_grammar",
                items=all_lessons,
                items_added=items_added,
                items_updated=items_updated,
                items_failed=0,
                errors=errors,
                duration_ms=duration_ms,
            )

        except Exception as e:
            logger.error("grammar_crawl_failed", job_id=job_id, error=str(e))
            job.status = CrawlStatus.FAILED
            job.error_log.append(str(e))

            return CrawlResult(
                success=False,
                source="english_grammar",
                items=[],
                errors=[str(e)],
                duration_ms=int((time.time() - start_time) * 1000),
            )

        finally:
            pass  # Don't cleanup after each request, let the service manage lifecycle

    async def crawl_word_definition(self, word: str, source: str = "free_dictionary") -> Optional[VocabularyItem]:
        try:
            if source == "free_dictionary":
                items = await self.free_dict_extractor.extract(word)
            elif source == "free_dict_api":
                items = await self.free_dict_api_extractor.extract(word)
            elif source == "wiktionary":
                items = await self.wiktionary_extractor.extract(word)
            else:
                items = await self.free_dict_extractor.extract(word)

            # Always save to file
            if items:
                try:
                    vocab_dicts = [model_to_camel_case(item) for item in items]
                    await file_storage_service.save_vocabulary(
                        items=vocab_dicts,
                        source=source,
                        metadata={"single_word": word},
                    )
                except Exception as e:
                    logger.error("file_storage_failed", error=str(e))

            return items[0] if items else None
        except Exception as e:
            logger.error("word_definition_crawl_failed", word=word, error=str(e))
            return None

    async def crawl_by_letter(
        self,
        letter: str,
        limit: int = 100,
        push_to_backend: bool = True,
    ) -> CrawlResult:
        """Crawl words starting with a specific letter from Wiktionary."""
        job_id = str(uuid.uuid4())
        start_time = time.time()

        job = CrawlJob(
            job_id=job_id,
            source="wiktionary",
            content_type="vocabulary",
            status=CrawlStatus.IN_PROGRESS,
            total_items=limit,
            started_at=time.time(),
        )
        self._active_jobs[job_id] = job

        logger.info("wiktionary_crawl_by_letter", job_id=job_id, letter=letter, limit=limit)

        try:
            words = await self.wiktionary_extractor.get_words_by_letter(letter)
            words = words[:limit]

            logger.info("wiktionary_words_found", job_id=job_id, count=len(words))

            all_items = []
            for word in words:
                items = await self.wiktionary_extractor.extract(word)
                all_items.extend(items)

            items_added = 0

            # Always save to file regardless of push_to_backend setting
            try:
                vocab_dicts = [model_to_camel_case(item) for item in all_items]
                saved_path = await file_storage_service.save_vocabulary(
                    items=vocab_dicts,
                    source="wiktionary",
                    metadata={
                        "letter": letter,
                        "job_id": job_id,
                    },
                )
                if saved_path:
                    logger.info("vocabulary_saved_to_file", filepath=saved_path)
            except Exception as e:
                logger.error("file_storage_failed", error=str(e))

            if push_to_backend and all_items:
                try:
                    vocab_dicts = [model_to_camel_case(item) for item in all_items]
                    result = await backend_client.post_vocabulary(vocab_dicts)
                    items_added = result.get("itemsAdded", 0)
                except Exception as e:
                    logger.error("backend_push_failed", error=str(e))

            duration_ms = int((time.time() - start_time) * 1000)
            job.status = CrawlStatus.COMPLETED
            job.items_crawled = len(all_items)
            job.items_added = items_added
            job.completed_at = time.time()

            return CrawlResult(
                success=True,
                source="wiktionary",
                items=all_items,
                items_added=items_added,
                items_updated=0,
                items_failed=len(words) - len(all_items),
                duration_ms=duration_ms,
            )

        except Exception as e:
            logger.error("wiktionary_crawl_failed", job_id=job_id, error=str(e))
            job.status = CrawlStatus.FAILED
            job.error_log.append(str(e))
            return CrawlResult(
                success=False,
                source="wiktionary",
                errors=[str(e)],
                duration_ms=int((time.time() - start_time) * 1000),
            )
        finally:
            pass  # Don't cleanup after each request, let the service manage lifecycle

    def get_job_status(self, job_id: str) -> Optional[CrawlJob]:
        return self._active_jobs.get(job_id)

    def list_active_jobs(self) -> list[CrawlJob]:
        return list(self._active_jobs.values())

    async def crawl_from_file(
        self,
        batch_size: int = 100,
        source: str = "free_dictionary",
        push_to_backend: bool = True,
    ) -> CrawlResult:
        """Crawl vocabulary from a word list file (e.g., /data/words.txt)."""
        import os

        job_id = str(uuid.uuid4())
        start_time = time.time()

        file_path = "/app/data/words.txt"
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Word file not found at {file_path}. Please mount the file to /app/data/words.txt")

        with open(file_path, "r", encoding="utf-8") as f:
            words = [line.strip().lower() for line in f if line.strip() and line.strip().isalpha()]

        if not words:
            return CrawlResult(
                success=False,
                source=source,
                errors=["No valid words found in file"],
                duration_ms=int((time.time() - start_time) * 1000),
            )

        logger.info("crawl_from_file_started", job_id=job_id, total_words=len(words), batch_size=batch_size)

        job = CrawlJob(
            job_id=job_id,
            source=source,
            content_type="vocabulary",
            status=CrawlStatus.IN_PROGRESS,
            words=words,
            total_items=len(words),
            started_at=time.time(),
        )
        self._active_jobs[job_id] = job

        try:
            all_items = []
            total_added = 0
            total_updated = 0
            total_failed = 0

            for i in range(0, len(words), batch_size):
                batch = words[i:i + batch_size]
                batch_num = i // batch_size + 1
                total_batches = (len(words) + batch_size - 1) // batch_size

                logger.info("processing_batch", job_id=job_id, batch=batch_num, total=total_batches, words=len(batch))

                if source == "free_dictionary":
                    items = await self.free_dict_extractor.extract_batch(batch)
                elif source == "free_dict_api":
                    items = await self.free_dict_api_extractor.extract_batch(batch)
                elif source == "wiktionary":
                    items = await self.wiktionary_extractor.extract_batch(batch)
                else:
                    items = await self.free_dict_extractor.extract_batch(batch)

                all_items.extend(items)

                total_failed += len(batch) - len(items)

                if i + batch_size < len(words):
                    await asyncio.sleep(1)

            # Always save to file regardless of push_to_backend setting
            try:
                vocab_dicts = [model_to_camel_case(item) for item in all_items]
                saved_path = await file_storage_service.save_vocabulary(
                    items=vocab_dicts,
                    source=source,
                    metadata={
                        "job_id": job_id,
                        "total_words": len(words),
                        "batch_size": batch_size,
                    },
                )
                if saved_path:
                    logger.info("vocabulary_saved_to_file", filepath=saved_path)
            except Exception as e:
                logger.error("file_storage_failed", error=str(e))

            if push_to_backend and all_items:
                try:
                    result = await backend_client.post_vocabulary(vocab_dicts)
                    total_added += result.get("itemsAdded", 0)
                    total_updated += result.get("itemsUpdated", 0)
                except Exception as e:
                    logger.error("backend_push_failed", error=str(e))

            duration_ms = int((time.time() - start_time) * 1000)
            job.status = CrawlStatus.COMPLETED
            job.items_crawled = len(all_items)
            job.items_added = total_added
            job.items_updated = total_updated
            job.items_failed = total_failed
            job.completed_at = time.time()

            logger.info(
                "crawl_from_file_completed",
                job_id=job_id,
                total_words=len(words),
                crawled=len(all_items),
                added=total_added,
                updated=total_updated,
                failed=total_failed,
                duration_ms=duration_ms,
            )

            return CrawlResult(
                success=True,
                source=source,
                items=all_items,
                items_added=total_added,
                items_updated=total_updated,
                items_failed=total_failed,
                duration_ms=duration_ms,
            )

        except Exception as e:
            logger.error("crawl_from_file_failed", job_id=job_id, error=str(e))
            job.status = CrawlStatus.FAILED
            job.error_log.append(str(e))
            return CrawlResult(
                success=False,
                source=source,
                errors=[str(e)],
                duration_ms=int((time.time() - start_time) * 1000),
            )

    async def cleanup(self) -> None:
        try:
            await self.free_dict_extractor.cleanup()
            await self.free_dict_api_extractor.cleanup()
            await self.oxford_extractor.cleanup()
            await self.wiktionary_extractor.cleanup()
            await self.grammar_extractor.cleanup()
        except Exception as e:
            logger.error("cleanup_failed", error=str(e))


crawler_service = CrawlerService()
