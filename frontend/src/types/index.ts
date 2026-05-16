export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  level: number;
  xp: number;
  streakDays: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Topic {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  _count?: { vocabularies: number };
}

export interface Vocabulary {
  id: string;
  topicId: string;
  word: string;
  pronunciation?: string;
  meaning: string;
  example?: string;
  exampleTranslation?: string;
  audioUrl?: string;
  imageUrl?: string;
  difficulty: number;
  partOfSpeech?: string;
}

export interface Flashcard {
  id: string;
  vocabularyId: string;
  frontContent: string;
  backContent: string;
  audioUrl?: string;
  imageUrl?: string;
  hint?: string;
}

export interface UserFlashcardReview {
  id: string;
  userId: string;
  flashcardId: string;
  flashcard: Flashcard;
  vocabulary: Vocabulary;
  repetitionCount: number;
  easeFactor: number;
  intervalDays: number;
  nextReviewAt: string;
  lastReviewedAt?: string;
  correctStreak: number;
  wrongCount: number;
}

export interface Quiz {
  id: string;
  lessonId?: string;
  title: string;
  description?: string;
  type: QuizType;
  durationSeconds?: number;
  passingScore: number;
  questions: QuizQuestion[];
  _count?: { questions: number };
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  type: QuestionType;
  question: string;
  explanation?: string;
  audioUrl?: string;
  imageUrl?: string;
  answers: QuizAnswer[];
}

export interface QuizAnswer {
  id: string;
  questionId: string;
  answer: string;
  isCorrect: boolean;
}

export type QuizType = 'MULTIPLE_CHOICE' | 'FILL_BLANK' | 'MATCHING' | 'SPEAKING' | 'MIXED';
export type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK' | 'ORDERING';

export interface LeaderboardEntry {
  rank: number;
  id: string;
  fullName: string;
  avatarUrl?: string;
  level: number;
  xp: number;
  streakDays: number;
}

export interface Notification {
  id: string;
  notification: {
    id: string;
    type: string;
    title: string;
    content: string;
  };
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface FlashcardStats {
  totalReviews: number;
  totalCards: number;
  dueCards: number;
  masteredCards: number;
  reviewsByDay: { date: string; count: number }[];
}
