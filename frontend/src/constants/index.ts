export const APP_ROUTES = {
  PUBLIC: {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
  },
  PRIVATE: {
    DASHBOARD: '/dashboard',
    VOCABULARY: '/vocabulary',
    FLASHCARDS: '/flashcards',
    QUIZZES: '/quizzes',
    GRAMMAR: '/grammar',
    SPEAKING: '/speaking',
    LEADERBOARD: '/leaderboard',
    SETTINGS: '/settings',
    PROFILE: '/profile',
  },
  ADMIN: {
    DASHBOARD: '/admin/analytics',
    USERS: '/admin/users',
    VOCABULARY_MANAGER: '/admin/vocabulary-manager',
    QUIZ_MANAGER: '/admin/quiz-manager',
  },
} as const;

export const QUERY_KEYS = {
  AUTH: {
    ME: ['auth', 'me'],
    SESSIONS: ['auth', 'sessions'],
  },
  USER: {
    PROFILE: (id: string) => ['user', id],
    LIST: ['users', 'list'],
  },
  VOCABULARY: {
    TOPICS: ['vocabulary', 'topics'],
    TOPIC: (slug: string) => ['vocabulary', 'topic', slug],
    SEARCH: (query: string) => ['vocabulary', 'search', query],
  },
  FLASHCARDS: {
    DUE: ['flashcards', 'due'],
    STATS: ['flashcards', 'stats'],
    ALL: ['flashcards', 'all'],
  },
  QUIZZES: {
    LIST: ['quizzes', 'list'],
    DETAIL: (id: string) => ['quizzes', id],
    HISTORY: ['quizzes', 'history'],
  },
  ANALYTICS: {
    STATS: ['analytics', 'stats'],
    LEADERBOARD: ['analytics', 'leaderboard'],
  },
} as const;
