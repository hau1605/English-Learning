import time
from typing import Optional
import structlog

from src.models import VocabularyItem, Definition
from src.extractors.base_extractor import BaseExtractor

logger = structlog.get_logger()


class FreeDictAPIExtractor(BaseExtractor):
    """
    Extract vocabulary from Free Dictionary API (freedictionaryapi.com).
    This API provides richer data including:
    - Multiple pronunciations with IPA notation
    - Part of speech categories
    - Multiple definitions with examples
    - Synonyms and antonyms
    - Source references
    """

    BASE_URL = "https://freedictionaryapi.com/api/v1/entries/en"

    def __init__(self):
        super().__init__("free_dict_api")

    async def extract(self, word: str, **kwargs) -> list[VocabularyItem]:
        """Extract a word from Free Dictionary API."""
        if not self.http_client:
            await self.initialize()

        url = f"{self.BASE_URL}/{word.lower().strip()}"
        logger.info("crawling_word", url=url)

        try:
            response = await self.http_client.get(
                url,
                source_key="free_dict_api",
                rate_limit=0.5,
            )

            data = response.json()
            if "word" not in data:
                logger.warning("unexpected_api_response", word=word)
                return []

            return self._parse_response(data)

        except Exception as e:
            logger.error("crawl_failed", word=word, error=str(e))
            return []

    def _parse_response(self, data: dict) -> list[VocabularyItem]:
        """Parse the Free Dictionary API response into VocabularyItems."""
        items = []
        word = data.get("word", "")
        entries = data.get("entries", [])

        all_synonyms = set()
        all_antonyms = set()
        all_examples = []

        for entry in entries:
            pos = entry.get("partOfSpeech", "")

            entry_synonyms = entry.get("synonyms", [])
            entry_antonyms = entry.get("antonyms", [])
            all_synonyms.update(entry_synonyms)
            all_antonyms.update(entry_antonyms)

            pronunciations = entry.get("pronunciations", [])
            phonetic = None
            for p in pronunciations:
                if p.get("type") == "ipa" and p.get("text"):
                    phonetic = p.get("text")
                    break

            senses = entry.get("senses", [])
            definitions = []

            for sense in senses:
                definition_text = sense.get("definition", "")
                if not definition_text:
                    continue

                examples = sense.get("examples", [])
                sense_examples = [ex for ex in examples if isinstance(ex, str)]
                all_examples.extend(sense_examples[:2])

                quotes = sense.get("quotes", [])
                for quote in quotes[:1]:
                    if isinstance(quote, dict) and quote.get("text"):
                        sense_examples.append(quote["text"][:200])

                sense_synonyms = sense.get("synonyms", [])[:5]
                sense_antonyms = sense.get("antonyms", [])[:5]

                definition = Definition(
                    meaning=definition_text[:500],
                    example=sense_examples[0] if sense_examples else None,
                    synonyms=sense_synonyms,
                    antonyms=sense_antonyms,
                )
                definitions.append(definition)

            if not definitions:
                continue

            item = VocabularyItem(
                word=word,
                phonetic=phonetic,
                audio_url=None,
                part_of_speech=[pos] if pos else [],
                definitions=definitions[:5],
                examples=all_examples[:5],
                synonyms=list(all_synonyms)[:15],
                antonyms=list(all_antonyms)[:10],
                difficulty=self._estimate_difficulty(word),
                cefr_level=self._estimate_cefr(word),
                source="free_dict_api",
                source_url=f"{self.BASE_URL}/{word}",
            )
            items.append(item)

        if not items and entries:
            item = VocabularyItem(
                word=word,
                part_of_speech=[],
                definitions=[],
                synonyms=list(all_synonyms)[:15],
                antonyms=list(all_antonyms)[:10],
                examples=all_examples[:5],
                source="free_dict_api",
                source_url=f"{self.BASE_URL}/{word}",
            )
            items.append(item)

        return items

    def _estimate_difficulty(self, word: str) -> int:
        """Estimate word difficulty based on characteristics."""
        word_lower = word.lower()

        easy_patterns = ["a", "e", "i", "o", "u", "the", "is", "are", "was", "be"]
        if word_lower in easy_patterns:
            return 1

        difficult_count = 0
        difficult_patterns = ["ph", "ch", "sch", "tion", "sion", "ough", "ei", "ie", "ea"]
        for pattern in difficult_patterns:
            if pattern in word_lower:
                difficult_count += 1

        length = len(word)
        if length > 10:
            difficult_count += 2
        elif length > 7:
            difficult_count += 1

        return max(1, min(5, difficult_count))

    def _estimate_cefr(self, word: str) -> str:
        """Estimate CEFR level based on word difficulty."""
        difficulty = self._estimate_difficulty(word)
        mapping = {1: "A1", 2: "A2", 3: "B1", 4: "B2", 5: "C1"}
        return mapping.get(difficulty, "B1")

    async def extract_batch(
        self, words: list[str], delay: float = 0.5
    ) -> list[VocabularyItem]:
        """Extract multiple words with rate limiting."""
        items = []
        for word in words:
            start_time = time.time()
            try:
                extracted = await self.extract(word)
                items.extend(extracted)
                logger.info(
                    "word_crawled",
                    word=word,
                    found=len(extracted),
                    duration_ms=int((time.time() - start_time) * 1000),
                )
            except Exception as e:
                logger.error("batch_crawl_error", word=word, error=str(e))

        return items
