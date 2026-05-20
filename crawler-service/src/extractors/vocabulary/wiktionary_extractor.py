import time
from typing import Optional
import structlog

from src.models import VocabularyItem
from src.extractors.base_extractor import BaseExtractor

logger = structlog.get_logger()


class WiktionaryExtractor(BaseExtractor):
    """Extract vocabulary from Wiktionary API."""

    BASE_URL = "https://en.wiktionary.org/w/api.php"

    def __init__(self):
        super().__init__("wiktionary")
        self._last_request_time = 0
        self._min_delay = 1.0

    async def extract(self, word: str) -> list[VocabularyItem]:
        """Extract a single word from Wiktionary."""
        await self._rate_limit()
        from src.models import VocabularyItem

        params = {
            "action": "parse",
            "page": word,
            "prop": "wikitext",
            "format": "json",
            "disabletoc": "1",
        }

        try:
            if not self.http_client:
                await self.initialize()

            response = await self.http_client.get(self.BASE_URL, params=params)
            data = response.json()

            if "parse" not in data:
                return []

            wikitext = data["parse"]["wikitext"]["*"]
            return self._parse_wikitext(word, wikitext)

        except Exception as e:
            logger.error("wiktionary_extract_error", word=word, error=str(e))
            return []

    def _parse_wikitext(self, word: str, wikitext: str) -> list[VocabularyItem]:
        """Parse Wiktionary wikitext to extract definitions."""
        from src.models import VocabularyItem
        import re

        definitions = []
        current_pos = None

        lines = wikitext.split("\n")
        for line in lines:
            line = line.strip()

            if line.startswith("{{POS|") or line.startswith("{{pos|"):
                match = re.search(r"\{\{POS\|([^}]+)\}\}", line, re.IGNORECASE)
                if match:
                    current_pos = match.group(1).lower()
            elif line.startswith("# ") and current_pos:
                definition = line[2:].strip()
                definition = re.sub(r"\[\[([^|\]]+?\|)?([^\]]+?)\]\]", r"\2", definition)
                definition = re.sub(r"\{\{[^}]+\}\}", "", definition)
                definition = re.sub(r"<ref[^>]*>.*?</ref>", "", definition, flags=re.DOTALL)

                if definition and len(definition) > 5:
                    definitions.append(VocabularyItem(
                        word=word,
                        part_of_speech=current_pos,
                        definition=definition[:500],
                        source="wiktionary",
                        example=None,
                        phonetic=None,
                        audio_url=None,
                    ))

                if len(definitions) >= 5:
                    break

        return definitions

    async def _rate_limit(self) -> None:
        """Simple rate limiting."""
        import asyncio
        elapsed = time.time() - self._last_request_time
        if elapsed < self._min_delay:
            await asyncio.sleep(self._min_delay - elapsed)
        self._last_request_time = time.time()

    async def get_word_list(self, prefix: str = "", limit: int = 500) -> list[str]:
        """Get a list of words from Wiktionary starting with prefix."""
        await self._rate_limit()

        params = {
            "action": "query",
            "list": "allpages",
            "apfrom": prefix if prefix else "",
            "aplimit": limit,
            "apfilterredir": "nonredirects",
            "format": "json",
        }

        try:
            if not self.http_client:
                await self.initialize()

            response = await self.http_client.get(self.BASE_URL, params=params)
            data = response.json()

            words = []
            if "query" in data and "allpages" in data["query"]:
                words = [page["title"] for page in data["query"]["allpages"]]
                words = [w for w in words if w and len(w) > 1 and w[0].isalpha() and w[0].islower()]

            return words[:limit]

        except Exception as e:
            logger.error("wiktionary_wordlist_error", prefix=prefix, error=str(e))
            return []

    async def get_words_by_letter(self, letter: str) -> list[str]:
        """Get all words starting with a specific letter."""
        return await self.get_word_list(prefix=letter.lower(), limit=500)

    async def extract_batch(self, words: list[str]) -> list[VocabularyItem]:
        """Extract multiple words."""
        all_items = []
        for word in words:
            items = await self.extract(word)
            all_items.extend(items)
        return all_items
