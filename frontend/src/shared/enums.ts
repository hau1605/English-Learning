export const QuizType = {
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
  FILL_BLANK: 'FILL_BLANK',
  MATCHING: 'MATCHING',
  SPEAKING: 'SPEAKING',
  MIXED: 'MIXED',
} as const;

export type QuizType = (typeof QuizType)[keyof typeof QuizType];

export const QuestionType = {
  SINGLE_CHOICE: 'SINGLE_CHOICE',
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
  FILL_BLANK: 'FILL_BLANK',
  MATCHING: 'MATCHING',
  ORDERING: 'ORDERING',
  SPEAKING: 'SPEAKING',
} as const;

export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType];

export const LessonType = {
  VOCABULARY: 'VOCABULARY',
  GRAMMAR: 'GRAMMAR',
  READING: 'READING',
  LISTENING: 'LISTENING',
  SPEAKING: 'SPEAKING',
  WRITING: 'WRITING',
} as const;

export type LessonType = (typeof LessonType)[keyof typeof LessonType];

export const UserRole = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
