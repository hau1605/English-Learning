export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export enum CourseLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

export enum CourseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum LessonType {
  VIDEO = 'VIDEO',
  READING = 'READING',
  INTERACTIVE = 'INTERACTIVE',
  PRACTICE = 'PRACTICE',
}

export enum QuizType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  FILL_BLANK = 'FILL_BLANK',
  MATCHING = 'MATCHING',
  SPEAKING = 'SPEAKING',
  MIXED = 'MIXED',
}

export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  FILL_BLANK = 'FILL_BLANK',
  ORDERING = 'ORDERING',
}

export enum ProcessingStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum NotificationType {
  SYSTEM = 'SYSTEM',
  STREAK = 'STREAK',
  ACHIEVEMENT = 'ACHIEVEMENT',
  REMINDER = 'REMINDER',
  SOCIAL = 'SOCIAL',
  PROMOTION = 'PROMOTION',
}

export enum JobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum FlashcardRating {
  AGAIN = 0,
  HARD = 1,
  GOOD = 2,
  EASY = 3,
}

export enum EventName {
  USER_REGISTERED = 'user.registered',
  USER_LOGGED_IN = 'user.logged_in',
  USER_LOGGED_OUT = 'user.logged_out',
  LESSON_STARTED = 'lesson.started',
  LESSON_COMPLETED = 'lesson.completed',
  QUIZ_STARTED = 'quiz.started',
  QUIZ_COMPLETED = 'quiz.completed',
  FLASHCARD_REVIEWED = 'flashcard.reviewed',
  SPEAKING_COMPLETED = 'speaking.completed',
  STREAK_UPDATED = 'streak.updated',
  XP_EARNED = 'xp.earned',
  LEADERBOARD_UPDATED = 'leaderboard.updated',
}
