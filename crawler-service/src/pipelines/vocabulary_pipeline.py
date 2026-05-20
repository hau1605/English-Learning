from typing import Optional
import structlog

from src.models import VocabularyItem

logger = structlog.get_logger()


class VocabularyPipeline:
    @staticmethod
    def normalize(item: VocabularyItem) -> VocabularyItem:
        item.word = item.word.strip().lower()
        if item.phonetic:
            item.phonetic = item.phonetic.strip()
        item.part_of_speech = [pos.strip().lower() for pos in item.part_of_speech]
        item.examples = [ex.strip() for ex in item.examples if ex.strip()]
        item.synonyms = [syn.strip().lower() for syn in item.synonyms if syn.strip()]
        item.antonyms = [ant.strip().lower() for ant in item.antonyms if ant.strip()]

        for defn in item.definitions:
            defn.meaning = defn.meaning.strip()
            if defn.example:
                defn.example = defn.example.strip()

        return item

    @staticmethod
    def deduplicate(item: VocabularyItem) -> VocabularyItem:
        item.part_of_speech = list(dict.fromkeys(item.part_of_speech))
        item.examples = list(dict.fromkeys(item.examples))
        item.synonyms = list(dict.fromkeys(item.synonyms))
        item.antonyms = list(dict.fromkeys(item.antonyms))

        seen_meanings = set()
        unique_definitions = []
        for defn in item.definitions:
            if defn.meaning not in seen_meanings:
                seen_meanings.add(defn.meaning)
                unique_definitions.append(defn)
        item.definitions = unique_definitions

        return item

    @staticmethod
    def enrich(item: VocabularyItem) -> VocabularyItem:
        if not item.cefr_level and item.difficulty:
            cefr_map = {1: "A1", 2: "A2", 3: "B1", 4: "B2", 5: "C1"}
            item.cefr_level = cefr_map.get(item.difficulty)

        if item.difficulty and not item.cefr_level:
            cefr_map = {1: "A1", 2: "A2", 3: "B1", 4: "B2", 5: "C1"}
            item.cefr_level = cefr_map.get(item.difficulty)

        return item

    @staticmethod
    def process(item: VocabularyItem) -> VocabularyItem:
        item = VocabularyPipeline.normalize(item)
        item = VocabularyPipeline.deduplicate(item)
        item = VocabularyPipeline.enrich(item)
        return item

    @staticmethod
    def process_batch(items: list[VocabularyItem]) -> list[VocabularyItem]:
        return [VocabularyPipeline.process(item) for item in items]
