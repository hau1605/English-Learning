export interface UserCreatedEvent {
  userId: string;
  email: string;
  fullName: string;
  createdAt: Date;
}

export interface XpUpdatedEvent {
  userId: string;
  xp: number;
  previousXp: number;
  source: 'quiz' | 'flashcard' | 'speaking' | 'streak' | 'other';
}

export interface LessonCompletedEvent {
  userId: string;
  lessonId: string;
  lessonType: 'vocabulary' | 'grammar' | 'quiz' | 'speaking';
  score: number;
  xpEarned: number;
}

export interface StreakUpdatedEvent {
  userId: string;
  streakDays: number;
  previousStreak: number;
}

export interface QuizCompletedEvent {
  userId: string;
  quizId: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  xpEarned: number;
}

export interface FlashcardReviewedEvent {
  userId: string;
  flashcardId: string;
  difficulty: 'again' | 'hard' | 'good' | 'easy';
  wasCorrect: boolean;
}

export interface SpeakingAttemptEvent {
  userId: string;
  attemptId: string;
  score: number;
  xpEarned: number;
}

export interface LeaderboardUpdatedEvent {
  rankings: Array<{
    userId: string;
    xp: number;
    rank: number;
    previousRank?: number;
  }>;
}
