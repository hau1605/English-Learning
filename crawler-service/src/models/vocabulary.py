from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from enum import Enum


class CrawlStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class VocabularyItem(BaseModel):
    word: str = Field(..., min_length=1, max_length=100)
    phonetic: Optional[str] = None
    audio_url: Optional[str] = None
    part_of_speech: list[str] = Field(default_factory=list)
    definitions: list["Definition"] = Field(default_factory=list)
    examples: list[str] = Field(default_factory=list)
    synonyms: list[str] = Field(default_factory=list)
    antonyms: list[str] = Field(default_factory=list)
    difficulty: int = Field(default=3, ge=1, le=5)
    cefr_level: Optional[str] = None
    source: str = "free_dictionary"
    source_url: Optional[str] = None
    crawled_at: datetime = Field(default_factory=datetime.utcnow)

    @field_validator("cefr_level")
    @classmethod
    def validate_cefr(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.upper() not in ["A1", "A2", "B1", "B2", "C1", "C2"]:
            raise ValueError("CEFR level must be A1, A2, B1, B2, C1, or C2")
        return v.upper() if v else None


class Definition(BaseModel):
    meaning: str
    example: Optional[str] = None
    synonyms: list[str] = Field(default_factory=list)
    antonyms: list[str] = Field(default_factory=list)


class TopicItem(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    slug: str
    icon: Optional[str] = None
    description: Optional[str] = None
    vocabulary_ids: list[int] = Field(default_factory=list)
    source: str = "manual"
    crawled_at: datetime = Field(default_factory=datetime.utcnow)


class GrammarLesson(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    category: str
    explanation: str
    examples: list["GrammarExample"] = Field(default_factory=list)
    exercises: list["GrammarExercise"] = Field(default_factory=list)
    difficulty: int = Field(default=3, ge=1, le=5)
    cefr_level: Optional[str] = None
    source: str = "grammar_website"
    source_url: Optional[str] = None
    crawled_at: datetime = Field(default_factory=datetime.utcnow)


class GrammarExample(BaseModel):
    sentence: str
    explanation: Optional[str] = None
    translation: Optional[str] = None


class GrammarExercise(BaseModel):
    question: str
    options: list[str] = Field(default_factory=list)
    correct_answer: str
    explanation: Optional[str] = None


class QuizItem(BaseModel):
    question: str = Field(..., min_length=1)
    quiz_type: str = "multiple_choice"
    options: list["QuizOption"] = Field(default_factory=list)
    correct_answer: str
    explanation: Optional[str] = None
    difficulty: int = Field(default=3, ge=1, le=5)
    category: str = "general"
    source: str = "crawled"
    crawled_at: datetime = Field(default_factory=datetime.utcnow)


class QuizOption(BaseModel):
    option: str
    is_correct: bool = False


class CrawlJob(BaseModel):
    id: Optional[int] = None
    job_id: str
    source: str
    content_type: str
    status: CrawlStatus = CrawlStatus.PENDING
    words: Optional[list[str]] = None
    total_items: int = 0
    items_crawled: int = 0
    items_added: int = 0
    items_updated: int = 0
    items_failed: int = 0
    error_log: list[str] = Field(default_factory=list)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CrawlResult(BaseModel):
    success: bool
    source: str
    items: list[VocabularyItem | GrammarLesson | QuizItem] = Field(default_factory=list)
    items_added: int = 0
    items_updated: int = 0
    items_failed: int = 0
    errors: list[str] = Field(default_factory=list)
    duration_ms: int = 0


VocabularyItem.model_rebuild()
GrammarLesson.model_rebuild()
QuizItem.model_rebuild()
