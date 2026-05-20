from typing import Optional
import structlog

from src.adapters import AsyncHTTPClient, HTMLParser
from src.models import GrammarLesson, GrammarExample, GrammarExercise
from src.extractors.base_extractor import BaseExtractor

logger = structlog.get_logger()


class GrammarExtractor(BaseExtractor):
    BASE_URL = "https://www.ego4u.com/en/learn-english-grammar"

    def __init__(self):
        super().__init__("english_grammar")

    async def extract(self, category: str = "basic", **kwargs) -> list[GrammarLesson]:
        if not self.http_client:
            await self.initialize()

        url = f"{self.BASE_URL}/{category}"
        logger.info("crawling_grammar", url=url)

        try:
            response = await self.http_client.get(
                url,
                source_key="english_grammar",
                rate_limit=2.0,
            )

            html = response.text
            soup = HTMLParser.parse(html)

            lessons = self._parse_page(soup, category, url)
            return lessons

        except Exception as e:
            logger.error("crawl_failed", category=category, error=str(e))
            return []

    def _parse_page(self, soup, category: str, base_url: str) -> list[GrammarLesson]:
        lessons = []

        lesson_links = soup.select(".content a, .grammar-list a, .topic a")
        for link in lesson_links:
            href = link.get("href", "")
            title = link.get_text(strip=True)
            if href and title and "/en/learn-english-grammar/" in href:
                lesson = self._parse_lesson(link, title, base_url)
                if lesson:
                    lessons.append(lesson)

        return lessons

    def _parse_lesson(self, link_element, title: str, base_url: str) -> Optional[GrammarLesson]:
        try:
            href = link_element.get("href", "")
            page_url = href if href.startswith("http") else f"https://www.ego4u.com{href}"

            explanation = HTMLParser.extract_text(link_element.parent, ".description") or ""
            if not explanation:
                explanation = f"Learn about {title}"

            examples = []
            example_elems = link_element.parent.select(".examples li, .example")
            for ex in example_elems[:3]:
                text = ex.get_text(strip=True)
                if text:
                    examples.append(GrammarExample(sentence=text))

            exercises = self._generate_exercises(title, explanation)

            difficulty = self._estimate_difficulty(title, explanation)

            return GrammarLesson(
                title=title,
                category=base_url.split("/")[-1],
                explanation=explanation,
                examples=examples,
                exercises=exercises,
                difficulty=difficulty,
                cefr_level=self._cefr_from_difficulty(difficulty),
                source="english_grammar",
                source_url=page_url,
            )

        except Exception as e:
            logger.error("parse_error", title=title, error=str(e))
            return None

    def _estimate_difficulty(self, title: str, explanation: str) -> int:
        text = f"{title} {explanation}".lower()
        beginner_keywords = ["present simple", "past simple", "basic", "beginner", "a1", "a2"]
        intermediate_keywords = ["present perfect", "past continuous", "relative", "b1", "b2"]
        advanced_keywords = ["subjunctive", "inversion", "advanced", "c1", "c2"]

        score = 3
        if any(kw in text for kw in beginner_keywords):
            score = 1
        elif any(kw in text for kw in intermediate_keywords):
            score = 3
        elif any(kw in text for kw in advanced_keywords):
            score = 5

        return score

    def _cefr_from_difficulty(self, difficulty: int) -> str:
        mapping = {1: "A1", 2: "A2", 3: "B1", 4: "B2", 5: "C1"}
        return mapping.get(difficulty, "B1")

    def _generate_exercises(self, title: str, explanation: str) -> list[GrammarExercise]:
        exercises = []
        exercise_types = [
            {
                "question": f"Complete the sentence: {title.split()[0]}...",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct": "Option A",
            },
            {
                "question": f"What is the correct form for {title}?",
                "options": ["Correct form 1", "Correct form 2", "Correct form 3", "Correct form 4"],
                "correct": "Correct form 1",
            },
        ]

        for ex in exercise_types[:2]:
            exercises.append(
                GrammarExercise(
                    question=ex["question"],
                    options=ex["options"],
                    correct_answer=ex["correct"],
                    explanation=explanation[:100] if explanation else None,
                )
            )

        return exercises
