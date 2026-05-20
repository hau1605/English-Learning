import pytest
from src.models import VocabularyItem, Definition


class TestVocabularyModel:
    def test_vocabulary_item_creation(self, sample_vocabulary_data):
        item = VocabularyItem(**sample_vocabulary_data)
        assert item.word == "hello"
        assert item.phonetic == "/həˈloʊ/"
        assert "noun" in item.part_of_speech
        assert len(item.definitions) == 1
        assert item.difficulty == 1
        assert item.cefr_level == "A1"

    def test_vocabulary_cefr_validation(self):
        item = VocabularyItem(
            word="test",
            cefr_level="B2",
        )
        assert item.cefr_level == "B2"

    def test_vocabulary_cefr_invalid(self):
        with pytest.raises(ValueError):
            VocabularyItem(
                word="test",
                cefr_level="D1",
            )

    def test_definition_model(self):
        definition = Definition(
            meaning="A greeting",
            example="Hello!",
            synonyms=["hi", "hey"],
            antonyms=["goodbye"],
        )
        assert definition.meaning == "A greeting"
        assert "hi" in definition.synonyms
        assert "goodbye" in definition.antonyms


class TestVocabularyPipeline:
    def test_normalize(self):
        from src.pipelines import VocabularyPipeline
        from src.models import VocabularyItem

        item = VocabularyItem(
            word="  HELLO  ",
            phonetic="  /həˈloʊ/  ",
            part_of_speech=["  Noun  ", "  verb  "],
            examples=["  Hello!  ", "  Hi there!  "],
            synonyms=["  hi  ", "  hey  "],
        )

        normalized = VocabularyPipeline.normalize(item)

        assert normalized.word == "hello"
        assert normalized.phonetic == "/həˈloʊ/"
        assert "noun" in normalized.part_of_speech
        assert "verb" in normalized.part_of_speech
        assert "hello!" in normalized.examples
        assert "hi" in normalized.synonyms

    def test_deduplicate(self):
        from src.pipelines import VocabularyPipeline
        from src.models import VocabularyItem, Definition

        item = VocabularyItem(
            word="test",
            part_of_speech=["noun", "noun", "verb"],
            examples=["hello", "hello", "hi"],
            definitions=[
                Definition(meaning="A test"),
                Definition(meaning="A test"),
                Definition(meaning="Another test"),
            ],
        )

        deduped = VocabularyPipeline.deduplicate(item)

        assert len(deduped.part_of_speech) == 2
        assert len(deduped.examples) == 2
        assert len(deduped.definitions) == 2

    def test_enrich_cefr_from_difficulty(self):
        from src.pipelines import VocabularyPipeline
        from src.models import VocabularyItem

        item = VocabularyItem(
            word="test",
            difficulty=3,
        )

        enriched = VocabularyPipeline.enrich(item)

        assert enriched.cefr_level == "B1"

    def test_process_batch(self):
        from src.pipelines import VocabularyPipeline
        from src.models import VocabularyItem

        items = [
            VocabularyItem(word="  hello  "),
            VocabularyItem(word="  WORLD  "),
        ]

        processed = VocabularyPipeline.process_batch(items)

        assert processed[0].word == "hello"
        assert processed[1].word == "world"
