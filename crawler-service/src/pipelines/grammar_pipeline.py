from typing import Optional
import structlog

from src.models import GrammarLesson

logger = structlog.get_logger()


class GrammarPipeline:
    @staticmethod
    def normalize(lesson: GrammarLesson) -> GrammarLesson:
        lesson.title = lesson.title.strip()
        lesson.category = lesson.category.strip().lower()
        lesson.explanation = lesson.explanation.strip()

        lesson.examples = [
            ex
            for ex in lesson.examples
            if ex.sentence.strip()
        ]

        for ex in lesson.examples:
            if ex.sentence:
                ex.sentence = ex.sentence.strip()
            if ex.translation:
                ex.translation = ex.translation.strip()
            if ex.explanation:
                ex.explanation = ex.explanation.strip()

        return lesson

    @staticmethod
    def deduplicate(lesson: GrammarLesson) -> GrammarLesson:
        seen_sentences = set()
        unique_examples = []
        for ex in lesson.examples:
            if ex.sentence and ex.sentence not in seen_sentences:
                seen_sentences.add(ex.sentence)
                unique_examples.append(ex)
        lesson.examples = unique_examples

        seen_questions = set()
        unique_exercises = []
        for exercise in lesson.exercises:
            if exercise.question and exercise.question not in seen_questions:
                seen_questions.add(exercise.question)
                unique_exercises.append(exercise)
        lesson.exercises = unique_exercises

        return lesson

    @staticmethod
    def enrich(lesson: GrammarLesson) -> GrammarLesson:
        if not lesson.cefr_level and lesson.difficulty:
            cefr_map = {1: "A1", 2: "A2", 3: "B1", 4: "B2", 5: "C1"}
            lesson.cefr_level = cefr_map.get(lesson.difficulty)

        return lesson

    @staticmethod
    def process(lesson: GrammarLesson) -> GrammarLesson:
        lesson = GrammarPipeline.normalize(lesson)
        lesson = GrammarPipeline.deduplicate(lesson)
        lesson = GrammarPipeline.enrich(lesson)
        return lesson

    @staticmethod
    def process_batch(lessons: list[GrammarLesson]) -> list[GrammarLesson]:
        return [GrammarPipeline.process(lesson) for lesson in lessons]
