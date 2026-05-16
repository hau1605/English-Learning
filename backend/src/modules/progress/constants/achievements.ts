export enum AchievementType {
  STREAK = 'streak',
  FLASHCARDS = 'flashcards',
  QUIZZES = 'quizzes',
  VOCABULARY = 'vocabulary',
  SPEAKING = 'speaking',
  XP = 'xp',
  LEVEL = 'level',
  SPECIAL = 'special',
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  requirement: number;
  type: AchievementType;
  category: 'learning' | 'streak' | 'social' | 'special';
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // Streak Achievements
  {
    id: 'streak_3',
    name: 'Getting Started',
    description: 'Maintain a 3-day streak',
    icon: '🔥',
    xpReward: 50,
    requirement: 3,
    type: AchievementType.STREAK,
    category: 'streak',
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    xpReward: 100,
    requirement: 7,
    type: AchievementType.STREAK,
    category: 'streak',
  },
  {
    id: 'streak_14',
    name: 'Two Week Champion',
    description: 'Maintain a 14-day streak',
    icon: '🔥',
    xpReward: 200,
    requirement: 14,
    type: AchievementType.STREAK,
    category: 'streak',
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    icon: '🔥',
    xpReward: 500,
    requirement: 30,
    type: AchievementType.STREAK,
    category: 'streak',
  },
  {
    id: 'streak_100',
    name: 'Century Learner',
    description: 'Maintain a 100-day streak',
    icon: '🔥',
    xpReward: 1000,
    requirement: 100,
    type: AchievementType.STREAK,
    category: 'streak',
  },

  // Flashcard Achievements
  {
    id: 'flashcards_10',
    name: 'First Steps',
    description: 'Review 10 flashcards',
    icon: '📚',
    xpReward: 25,
    requirement: 10,
    type: AchievementType.FLASHCARDS,
    category: 'learning',
  },
  {
    id: 'flashcards_100',
    name: 'Card Collector',
    description: 'Review 100 flashcards',
    icon: '📚',
    xpReward: 100,
    requirement: 100,
    type: AchievementType.FLASHCARDS,
    category: 'learning',
  },
  {
    id: 'flashcards_500',
    name: 'Flashcard Fanatic',
    description: 'Review 500 flashcards',
    icon: '📚',
    xpReward: 300,
    requirement: 500,
    type: AchievementType.FLASHCARDS,
    category: 'learning',
  },
  {
    id: 'flashcards_1000',
    name: 'Vocabulary Master',
    description: 'Review 1000 flashcards',
    icon: '📚',
    xpReward: 500,
    requirement: 1000,
    type: AchievementType.FLASHCARDS,
    category: 'learning',
  },

  // Quiz Achievements
  {
    id: 'quizzes_5',
    name: 'Quiz Taker',
    description: 'Complete 5 quizzes',
    icon: '📝',
    xpReward: 50,
    requirement: 5,
    type: AchievementType.QUIZZES,
    category: 'learning',
  },
  {
    id: 'quizzes_25',
    name: 'Quiz Enthusiast',
    description: 'Complete 25 quizzes',
    icon: '📝',
    xpReward: 150,
    requirement: 25,
    type: AchievementType.QUIZZES,
    category: 'learning',
  },
  {
    id: 'quizzes_100',
    name: 'Quiz Champion',
    description: 'Complete 100 quizzes',
    icon: '📝',
    xpReward: 400,
    requirement: 100,
    type: AchievementType.QUIZZES,
    category: 'learning',
  },

  // Vocabulary Achievements
  {
    id: 'vocabulary_50',
    name: 'Word Explorer',
    description: 'Learn 50 new words',
    icon: '📖',
    xpReward: 100,
    requirement: 50,
    type: AchievementType.VOCABULARY,
    category: 'learning',
  },
  {
    id: 'vocabulary_200',
    name: 'Vocabulary Builder',
    description: 'Learn 200 new words',
    icon: '📖',
    xpReward: 250,
    requirement: 200,
    type: AchievementType.VOCABULARY,
    category: 'learning',
  },
  {
    id: 'vocabulary_500',
    name: 'Wordsmith',
    description: 'Learn 500 new words',
    icon: '📖',
    xpReward: 500,
    requirement: 500,
    type: AchievementType.VOCABULARY,
    category: 'learning',
  },

  // XP Achievements
  {
    id: 'xp_1000',
    name: 'Rising Star',
    description: 'Earn 1000 XP',
    icon: '⭐',
    xpReward: 50,
    requirement: 1000,
    type: AchievementType.XP,
    category: 'learning',
  },
  {
    id: 'xp_5000',
    name: 'XP Hunter',
    description: 'Earn 5000 XP',
    icon: '⭐',
    xpReward: 150,
    requirement: 5000,
    type: AchievementType.XP,
    category: 'learning',
  },
  {
    id: 'xp_10000',
    name: 'XP Master',
    description: 'Earn 10000 XP',
    icon: '⭐',
    xpReward: 300,
    requirement: 10000,
    type: AchievementType.XP,
    category: 'learning',
  },

  // Level Achievements
  {
    id: 'level_5',
    name: 'Level 5 Achiever',
    description: 'Reach Level 5',
    icon: '🏆',
    xpReward: 100,
    requirement: 5,
    type: AchievementType.LEVEL,
    category: 'learning',
  },
  {
    id: 'level_10',
    name: 'Level 10 Expert',
    description: 'Reach Level 10',
    icon: '🏆',
    xpReward: 250,
    requirement: 10,
    type: AchievementType.LEVEL,
    category: 'learning',
  },
  {
    id: 'level_25',
    name: 'Level 25 Legend',
    description: 'Reach Level 25',
    icon: '🏆',
    xpReward: 500,
    requirement: 25,
    type: AchievementType.LEVEL,
    category: 'learning',
  },

  // Speaking Achievements
  {
    id: 'speaking_10',
    name: 'Voice Starter',
    description: 'Complete 10 speaking exercises',
    icon: '🎤',
    xpReward: 75,
    requirement: 10,
    type: AchievementType.SPEAKING,
    category: 'learning',
  },
  {
    id: 'speaking_50',
    name: 'Pronunciation Pro',
    description: 'Complete 50 speaking exercises',
    icon: '🎤',
    xpReward: 200,
    requirement: 50,
    type: AchievementType.SPEAKING,
    category: 'learning',
  },
];

export function getXpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.2, level - 1));
}

export function getTotalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getXpForLevel(i);
  }
  return total;
}
