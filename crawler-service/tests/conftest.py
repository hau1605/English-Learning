import pytest
import asyncio


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def sample_vocabulary_data():
    return {
        "word": "hello",
        "phonetic": "/həˈloʊ/",
        "audio_url": "https://api.dictionaryapi.dev/media/pronunciations/en/hello-uk.mp3",
        "part_of_speech": ["noun", "verb", "exclamation"],
        "definitions": [
            {
                "meaning": "Used as a greeting or to begin a phone conversation",
                "example": "Hello, how are you?",
                "synonyms": ["hi", "hey"],
                "antonyms": ["goodbye"],
            }
        ],
        "examples": [
            "Hello, world!",
            "She said hello to everyone.",
        ],
        "synonyms": ["hi", "hey"],
        "antonyms": ["goodbye"],
        "difficulty": 1,
        "cefr_level": "A1",
        "source": "free_dictionary",
    }


@pytest.fixture
def sample_grammar_data():
    return {
        "title": "Present Simple Tense",
        "category": "basic",
        "explanation": "The present simple tense is used to describe habits, unchanging situations, and general truths.",
        "examples": [
            {"sentence": "I drink coffee every morning.", "translation": "Tôi uống cà phê mỗi sáng."},
            {"sentence": "She works at a bank.", "translation": "Cô ấy làm việc ở ngân hàng."},
        ],
        "exercises": [
            {
                "question": "Complete: He _____ to school every day.",
                "options": ["go", "goes", "going", "went"],
                "correct_answer": "goes",
                "explanation": "Third person singular uses 'goes'",
            }
        ],
        "difficulty": 1,
        "cefr_level": "A1",
        "source": "english_grammar",
    }
