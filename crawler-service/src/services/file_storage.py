import json
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

import structlog

from config import get_settings

logger = structlog.get_logger()


class FileStorageService:
    """Service to save crawled data to JSON files."""

    def __init__(self):
        self.settings = get_settings()
        self.output_dir = Path(self.settings.crawl_output_dir)

    def _ensure_output_dir(self) -> Path:
        """Ensure output directory exists."""
        self.output_dir.mkdir(parents=True, exist_ok=True)
        return self.output_dir

    def _generate_filename(self, content_type: str, source: str) -> str:
        """Generate unique filename for crawl data."""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        safe_source = source.replace("/", "_").replace(" ", "_")
        return f"crawl_{content_type}_{safe_source}_{timestamp}_{unique_id}.json"

    async def save_vocabulary(
        self,
        items: list[dict],
        source: str,
        metadata: Optional[dict] = None,
    ) -> Optional[str]:
        """
        Save vocabulary crawl results to a JSON file.

        Returns the file path if successful, None otherwise.
        """
        if not items:
            logger.warning("file_storage_skip_empty", reason="no items to save")
            return None

        try:
            output_dir = self._ensure_output_dir()
            filename = self._generate_filename("vocabulary", source)
            filepath = output_dir / filename

            logger.info("file_storage_saving", filepath=str(filepath), item_count=len(items))

            data = {
                "metadata": {
                    "content_type": "vocabulary",
                    "source": source,
                    "created_at": datetime.utcnow().isoformat(),
                    "item_count": len(items),
                    **(metadata or {}),
                },
                "items": items,
            }

            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            logger.info(
                "vocabulary_saved_to_file",
                filepath=str(filepath),
                item_count=len(items),
                source=source,
            )

            return str(filepath)

        except Exception as e:
            logger.error("file_storage_vocabulary_failed", error=str(e), exc_info=True)
            return None

    async def save_grammar(
        self,
        items: list[dict],
        source: str,
        metadata: Optional[dict] = None,
    ) -> Optional[str]:
        """
        Save grammar crawl results to a JSON file.

        Returns the file path if successful, None otherwise.
        """
        if not items:
            logger.warning("file_storage_skip_empty", reason="no items to save")
            return None

        try:
            output_dir = self._ensure_output_dir()
            filename = self._generate_filename("grammar", source)
            filepath = output_dir / filename

            data = {
                "metadata": {
                    "content_type": "grammar",
                    "source": source,
                    "created_at": datetime.utcnow().isoformat(),
                    "item_count": len(items),
                    **(metadata or {}),
                },
                "items": items,
            }

            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            logger.info(
                "grammar_saved_to_file",
                filepath=str(filepath),
                item_count=len(items),
                source=source,
            )

            return str(filepath)

        except Exception as e:
            logger.error("file_storage_grammar_failed", error=str(e))
            return None

    def list_crawl_files(self, content_type: Optional[str] = None) -> list[dict]:
        """List all crawl files, optionally filtered by content type."""
        output_dir = self._ensure_output_dir()

        files = []
        pattern = "crawl_*"
        if content_type:
            pattern = f"crawl_{content_type}_*.json"

        for filepath in sorted(output_dir.glob(pattern), key=lambda p: p.stat().st_mtime, reverse=True):
            stat = filepath.stat()
            parts = filepath.stem.split("_")

            files.append({
                "filename": filepath.name,
                "filepath": str(filepath),
                "size_bytes": stat.st_size,
                "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                "content_type": parts[2] if len(parts) > 2 else "unknown",
                "source": parts[3] if len(parts) > 3 else "unknown",
            })

        return files

    def read_crawl_file(self, filename: str) -> Optional[dict]:
        """Read and return contents of a crawl file."""
        filepath = self.output_dir / filename

        if not filepath.exists():
            logger.warning("file_storage_file_not_found", filename=filename)
            return None

        try:
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error("file_storage_read_failed", filename=filename, error=str(e))
            return None


file_storage_service = FileStorageService()
