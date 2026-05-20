from dataclasses import dataclass
from typing import Optional
from enum import Enum


class SourceType(str, Enum):
    API = "api"
    WEB = "web"
    FILE = "file"


class ContentType(str, Enum):
    VOCABULARY = "vocabulary"
    GRAMMAR = "grammar"
    QUIZ = "quiz"
    TOPIC = "topic"


@dataclass
class CrawlSource:
    name: str
    url: str
    source_type: SourceType
    content_type: ContentType
    requires_browser: bool = False
    rate_limit: float = 1.0
    headers: Optional[dict] = None
    parser_type: str = "html"


SOURCES = {
    "free_dictionary": CrawlSource(
        name="Free Dictionary API (dictionaryapi.dev)",
        url="https://api.dictionaryapi.dev/api/v2/entries/en/{word}",
        source_type=SourceType.API,
        content_type=ContentType.VOCABULARY,
        rate_limit=1,
    ),
    "free_dict_api": CrawlSource(
        name="Free Dictionary API (freedictionaryapi.com)",
        url="https://freedictionaryapi.com/api/v1/entries/en/{word}",
        source_type=SourceType.API,
        content_type=ContentType.VOCABULARY,
        rate_limit=0.5,
    ),
    "wiktionary": CrawlSource(
        name="Wiktionary",
        url="https://en.wiktionary.org/wiki/{word}",
        source_type=SourceType.API,
        content_type=ContentType.VOCABULARY,
        requires_browser=False,
        rate_limit=1.0,
        parser_type="wikitext",
    ),
    "oxford_learner": CrawlSource(
        name="Oxford Learner's Dictionary",
        url="https://www.oxfordlearnersdictionaries.com/definition/english/{word}",
        source_type=SourceType.WEB,
        content_type=ContentType.VOCABULARY,
        requires_browser=True,
        rate_limit=2.0,
        parser_type="html",
    ),
    "cambridge": CrawlSource(
        name="Cambridge Dictionary",
        url="https://dictionary.cambridge.org/dictionary/english/{word}",
        source_type=SourceType.WEB,
        content_type=ContentType.VOCABULARY,
        requires_browser=False,
        rate_limit=1.5,
        parser_type="html",
    ),
    "merriam_webster": CrawlSource(
        name="Merriam-Webster Dictionary",
        url="https://www.dictionaryapi.com/api/v3/references/learners/json/{word}",
        source_type=SourceType.API,
        content_type=ContentType.VOCABULARY,
        rate_limit=1.0,
        headers={"api_key": ""},
    ),
    "wordnik": CrawlSource(
        name="Wordnik",
        url="https://api.wordnik.com/v4/word.json/{word}/definitions",
        source_type=SourceType.API,
        content_type=ContentType.VOCABULARY,
        rate_limit=1.0,
        headers={"api_key": ""},
    ),
}

GRAMMAR_SOURCES = {
    "english_grammar": CrawlSource(
        name="English Grammar Online",
        url="https://www.ego4u.com/en/learn-english-grammar",
        source_type=SourceType.WEB,
        content_type=ContentType.GRAMMAR,
        requires_browser=True,
        rate_limit=2.0,
    ),
    "grammar_quiz": CrawlSource(
        name="Grammar Quiz",
        url="https://www.grammarquiz.net/quiz",
        source_type=SourceType.WEB,
        content_type=ContentType.GRAMMAR,
        requires_browser=False,
        rate_limit=1.0,
    ),
}


def get_source(source_key: str) -> CrawlSource | None:
    return SOURCES.get(source_key) or GRAMMAR_SOURCES.get(source_key)
    return SOURCES.get(source_key) or GRammar_SOURCES.get(source_key)
