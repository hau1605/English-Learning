export const CACHE_KEYS = {
  USER: {
    PROFILE: (id: string) => `user:profile:${id}`,
    PERMISSIONS: (id: string) => `user:permissions:${id}`,
    SESSION: (id: string) => `session:${id}`,
  },
  FLASHCARD: {
    DUE: (userId: string) => `flashcards:due:${userId}`,
    STATS: (userId: string) => `flashcards:stats:${userId}`,
  },
  QUIZ: {
    DETAIL: (id: string) => `quiz:detail:${id}`,
  },
  VOCABULARY: {
    TOPICS: 'vocabulary:topics',
    TOPIC: (id: string) => `vocabulary:topic:${id}`,
  },
  LEADERBOARD: {
    GLOBAL: 'leaderboard:global',
    WEEKLY: 'leaderboard:weekly',
  },
  RATE_LIMIT: {
    LOGIN: (ip: string) => `rate_limit:login:${ip}`,
    API: (userId: string) => `rate_limit:api:${userId}`,
  },
  MENU: {
    ALL: 'menu:all',
    USER: (roleCodes: string[]) => `menu:user:${[...roleCodes].sort().join(',')}`,
  },
} as const;

export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 600, // 10 minutes
  EXTRA_LONG: 3600, // 1 hour
} as const;
