from typing import Optional
import structlog

from src.adapters import AsyncHTTPClient, HTMLParser
from src.models import VocabularyItem, Definition
from src.extractors.base_extractor import BaseExtractor

logger = structlog.get_logger()


class OxfordExtractor(BaseExtractor):
    BASE_URL = "https://www.oxfordlearnersdictionaries.com/definition/english"

    def __init__(self):
        super().__init__("oxford_learner")

    async def extract(self, word: str, **kwargs) -> list[VocabularyItem]:
        if not self.http_client:
            await self.initialize()

        url = f"{self.BASE_URL}/{word.lower().strip().replace(' ', '-')}"
        logger.info("crawling_oxford", url=url)

        try:
            response = await self.http_client.get(
                url,
                source_key="oxford_learner",
                rate_limit=2.0,
            )

            html = response.text
            soup = HTMLParser.parse(html)

            items = self._parse_page(soup, word, url)
            return items

        except Exception as e:
            logger.error("crawl_failed", word=word, error=str(e))
            return []

    def _parse_page(self, soup, word: str, url: str) -> list[VocabularyItem]:
        items = []

        entry_sections = soup.select(".entry")
        if not entry_sections:
            logger.warning("no_entries_found", word=word)
            return items

        for entry in entry_sections:
            item = self._parse_entry(entry, word, url)
            if item:
                items.append(item)

        return items

    def _parse_entry(self, entry, word: str, url: str) -> Optional[VocabularyItem]:
        try:
            headword = HTMLParser.extract_text(entry, ".headword")
            if not headword:
                headword = word

            phonetic = HTMLParser.extract_text(entry, ".phonetics")
            if not phonetic:
                phonetic = HTMLParser.extract_text(entry, ".PronCodes")

            audio_elem = entry.select_one(".phonetics .speaker")
            audio_url = audio_elem.get("data-src-mp3") if audio_elem else None

            parts_of_speech = HTMLParser.extract_texts(entry, ".part_of_speech")
            if not parts_of_speech:
                parts_of_speech = HTMLParser.extract_texts(entry, ".pos")

            definitions = []
            def_blocks = entry.select(".sense .definition")
            for def_block in def_blocks[:5]:
                def_text = HTMLParser.extract_text(def_block, ".def")
                if def_text:
                    example_elem = def_block.select_one(".examples .example")
                    example = example_elem.get_text(strip=True) if example_elem else None
                    definitions.append(Definition(meaning=def_text, example=example))

            cefr_elem = entry.select_one(".cf")
            cefr_level = cefr_elem.get_text(strip=True).upper() if cefr_elem else None

            difficulty = 3
            if cefr_level in ["A1", "A2"]:
                difficulty = 1
            elif cefr_level == "B1":
                difficulty = 2
            elif cefr_level == "B2":
                difficulty = 4
            elif cefr_level == "C1":
                difficulty = 5

            return VocabularyItem(
                word=headword,
                phonetic=phonetic,
                audio_url=audio_url,
                part_of_speech=parts_of_speech,
                definitions=definitions,
                examples=[],
                synonyms=[],
                antonyms=[],
                difficulty=difficulty,
                cefr_level=cefr_level,
                source="oxford_learner",
                source_url=url,
            )

        except Exception as e:
            logger.error("parse_error", error=str(e), word=word)
            return None
