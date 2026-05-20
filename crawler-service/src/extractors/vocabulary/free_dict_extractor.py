import time
from typing import Optional
import structlog

from src.adapters import AsyncHTTPClient, JSONParser
from src.models import VocabularyItem, Definition
from src.extractors.base_extractor import BaseExtractor

logger = structlog.get_logger()


class FreeDictExtractor(BaseExtractor):
    BASE_URL = "https://api.dictionaryapi.dev/api/v2/entries/en"

    def __init__(self):
        super().__init__("free_dictionary")

    async def extract(self, word: str, **kwargs) -> list[VocabularyItem]:
        if not self.http_client:
            await self.initialize()

        url = f"{self.BASE_URL}/{word.lower().strip()}"
        logger.info("crawling_word", url=url)

        try:
            response = await self.http_client.get(
                url,
                source_key="free_dictionary",
                rate_limit=0.5,
            )

            data = response.json()
            if not isinstance(data, list):
                logger.warning("unexpected_api_response", data_type=type(data))
                return []

            items = []
            for entry in data:
                item = self._parse_entry(entry)
                if item:
                    items.append(item)

            return items

        except Exception as e:
            logger.error("crawl_failed", word=word, error=str(e))
            return []

    def _parse_entry(self, entry: dict) -> Optional[VocabularyItem]:
        try:
            word = entry.get("word", "")
            if not word:
                return None

            phonetic = entry.get("phonetic", "")
            if not phonetic:
                phonetics = entry.get("phonetics", [])
                for p in phonetics:
                    if p.get("text"):
                        phonetic = p["text"]
                        break

            audio_url = None
            phonetics = entry.get("phonetics", [])
            for p in phonetics:
                if p.get("audio"):
                    audio_url = p["audio"]
                    break

            parts_of_speech = []
            definitions = []

            for meaning in entry.get("meanings", []):
                pos = meaning.get("partOfSpeech", "")
                if pos and pos not in parts_of_speech:
                    parts_of_speech.append(pos)

                for def_data in meaning.get("definitions", []):
                    definition = Definition(
                        meaning=def_data.get("definition", ""),
                        example=def_data.get("example"),
                        synonyms=def_data.get("synonyms", [])[:10],
                        antonyms=def_data.get("antonyms", [])[:10],
                    )
                    definitions.append(definition)

            synonyms = set()
            antonyms = set()
            examples = []

            for meaning in entry.get("meanings", []):
                synonyms.update(meaning.get("synonyms", [])[:5])
                antonyms.update(meaning.get("antonyms", [])[:5])
                for def_data in meaning.get("definitions", []):
                    if def_data.get("example"):
                        examples.append(def_data["example"])

            difficulty = self._estimate_difficulty(word)

            return VocabularyItem(
                word=word,
                phonetic=phonetic,
                audio_url=audio_url,
                part_of_speech=parts_of_speech,
                definitions=definitions[:5],
                examples=examples[:5],
                synonyms=list(synonyms)[:10],
                antonyms=list(antonyms)[:10],
                difficulty=difficulty,
                cefr_level=self._estimate_cefr(difficulty),
                source="free_dictionary",
                source_url=f"{self.BASE_URL}/{word}",
            )

        except Exception as e:
            logger.error("parse_error", error=str(e))
            return None

    def _estimate_difficulty(self, word: str) -> int:
        word_lower = word.lower()
        difficult_patterns = ["ph", "ch", "sch", "tion", "sion", "ough"]
        easy_patterns = ["a", "e", "i", "o", "u", "the", "is", "are", "was", "were"]

        score = 1
        score += sum(1 for p in difficult_patterns if p in word_lower)
        score += sum(-0.5 for p in easy_patterns if p == word_lower)

        return max(1, min(5, int(score)))

    def _estimate_cefr(self, difficulty: int) -> str:
        mapping = {1: "A1", 2: "A2", 3: "B1", 4: "B2", 5: "C1"}
        return mapping.get(difficulty, "B1")

    async def extract_batch(
        self, words: list[str], delay: float = 0.5
    ) -> list[VocabularyItem]:
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
