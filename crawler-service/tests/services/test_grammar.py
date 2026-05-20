import pytest
from src.models import GrammarLesson, GrammarExample, GrammarExercise


class TestGrammarModel:
    def test_grammar_lesson_creation(self, sample_grammar_data):
        lesson = GrammarLesson(**sample_grammar_data)
        assert lesson.title == "Present Simple Tense"
        assert lesson.category == "basic"
        assert lesson.difficulty == 1
        assert lesson.cefr_level == "A1"
        assert len(lesson.examples) == 2
        assert len(lesson.exercises) == 1

    def test_grammar_example(self):
        example = GrammarExample(
            sentence="I love learning English.",
            explanation="Subject + verb + object",
            translation="Tôi thích học tiếng Anh.",
        )
        assert example.sentence == "I love learning English."
        assert example.translation == "Tôi thích học tiếng Anh."

    def test_grammar_exercise(self):
        exercise = GrammarExercise(
            question="Complete the sentence",
            options=["A", "B", "C", "D"],
            correct_answer="A",
            explanation="This is the correct form",
        )
        assert exercise.correct_answer == "A"
        assert len(exercise.options) == 4


class TestGrammarPipeline:
    def test_normalize(self):
        from src.pipelines import GrammarPipeline
        from src.models import GrammarLesson, GrammarExample

        lesson = GrammarLesson(
            title="  Present Simple  ",
            category="  Basic  ",
            explanation="  The present simple tense...  ",
            examples=[
                GrammarExample(sentence="  I eat apples.  "),
                GrammarExample(sentence="  She eats apples.  "),
            ],
        )

        normalized = GrammarPipeline.normalize(lesson)

        assert normalized.title == "Present Simple"
        assert normalized.category == "basic"
        assert "I eat apples." in [ex.sentence for ex in normalized.examples]

    def test_deduplicate(self):
        from src.pipelines import GrammarPipeline
        from src.models import GrammarLesson, GrammarExample, GrammarExercise

        lesson = GrammarLesson(
            title="Test",
            category="test",
            explanation="Test",
            examples=[
                GrammarExample(sentence="Hello"),
                GrammarExample(sentence="Hello"),
                GrammarExample(sentence="Hi"),
            ],
            exercises=[
                GrammarExercise(question="Q1", options=["A"], correct_answer="A"),
                GrammarExercise(question="Q1", options=["A"], correct_answer="A"),
            ],
        )

        deduped = GrammarPipeline.deduplicate(lesson)

        assert len(deduped.examples) == 2
        assert len(deduped.exercises) == 1

    def test_enrich(self):
        from src.pipelines import GrammarPipeline
        from src.models import GrammarLesson

        lesson = GrammarLesson(
            title="Test",
            category="test",
            explanation="Test",
            difficulty=3,
        )

        enriched = GrammarPipeline.enrich(lesson)

        assert enriched.cefr_level == "B1"
