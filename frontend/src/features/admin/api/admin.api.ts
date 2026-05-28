import { api, ApiResponse } from '@/services/api';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalFlashcards: number;
  totalQuizzes: number;
  totalVocabulary: number;
}

export interface AnalyticsOverview {
  dailyActiveUsers: {
    weekly: number;
    monthly: number;
  };
  weeklyActivity: {
    learnedWords?: number;
    flashcardsReviewed?: number;
    quizzesCompleted?: number;
    studyMinutes?: number;
    xpEarned?: number;
  };
  monthlyActivity: {
    learnedWords?: number;
    flashcardsReviewed?: number;
    quizzesCompleted?: number;
    studyMinutes?: number;
    xpEarned?: number;
  };
  contentStats: {
    totalVocabulary: number;
    totalFlashcards: number;
  };
}

export interface RecentActivity {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  actor: {
    id: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
}

export interface UserWithStats {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  level: number;
  xp: number;
  streakDays: number;
  status: string;
  roleCodes?: string[];
  createdAt: string;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserEngagementReport {
  period: { start: string; end: string };
  dailyStats: Array<{
    date: string;
    learnedWords: number;
    flashcardsReviewed: number;
    quizzesCompleted: number;
    studyMinutes: number;
    xpEarned: number;
  }>;
  totals: {
    learnedWords?: number;
    flashcardsReviewed?: number;
    quizzesCompleted?: number;
    studyMinutes?: number;
    xpEarned?: number;
  };
  averages: {
    learnedWords?: number;
    flashcardsReviewed?: number;
    quizzesCompleted?: number;
  };
  activeUsers: number;
}

export interface QuizPerformanceReport {
  period: { start: string; end: string };
  overallStats: {
    totalAttempts: number;
    averageScore: number;
    passRate: number;
  };
  quizStats: Array<{
    quizId: string;
    _count: number;
    _avg: { score: number };
    quiz?: { title: string; type: string; passingScore: number };
  }>;
}

export interface LearningProgressReport {
  totalUsers: number;
  vocabularyByDifficulty: Array<{ difficulty: number; _count: number }>;
  flashcardEngagement: {
    totalReviewers: number;
    averageCardsPerUser: number;
  };
  topUsers: Array<{
    id: string;
    fullName: string;
    level: number;
    xp: number;
    streakDays: number;
    totalReviews: number;
    totalQuizAttempts: number;
  }>;
}

export interface SystemSettingRow {
  id: string;
  key: string;
  value: string;
  type: string;
  category: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertSystemSettingPayload {
  key: string;
  value: string;
  type?: string;
  category?: string;
  isPublic?: boolean;
}

export type SystemSettings = SystemSettingRow[];

function extractSystemSettingRows(payload: unknown): SystemSettingRow[] {
  if (Array.isArray(payload)) return payload;

  if (!payload || typeof payload !== 'object') return [];

  const record = payload as { data?: unknown; items?: unknown };

  if (Array.isArray(record.data)) return record.data;
  if (Array.isArray(record.items)) return record.items;

  if (record.data && typeof record.data === 'object') {
    const nested = record.data as { data?: unknown; items?: unknown };
    if (Array.isArray(nested.data)) return nested.data;
    if (Array.isArray(nested.items)) return nested.items;
  }

  return [];
}

export const adminApi = {
  getDashboardStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await api.get<ApiResponse<DashboardStats>>('/admin/dashboard');
    return response.data;
  },

  getAnalyticsOverview: async (): Promise<ApiResponse<AnalyticsOverview>> => {
    const response = await api.get<ApiResponse<AnalyticsOverview>>('/admin/dashboard/analytics');
    return response.data;
  },

  getRecentActivity: async (limit?: number): Promise<ApiResponse<RecentActivity[]>> => {
    const response = await api.get<ApiResponse<RecentActivity[]>>('/admin/activity', {
      params: { limit },
    });
    return response.data;
  },

  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) => {
    const response = await api.get<ApiResponse<UserWithStats[]> & { meta: PaginationMeta }>('/admin/users', {
      params,
    });
    return response.data;
  },

  assignRole: async (userId: string, roleCode: string): Promise<ApiResponse<any>> => {
    const response = await api.post<ApiResponse<any>>(`/admin/users/${userId}/roles`, { roleCode });
    return response.data;
  },

  removeRole: async (userId: string, roleCode: string): Promise<ApiResponse<any>> => {
    const response = await api.delete<ApiResponse<any>>(`/admin/users/${userId}/roles/${roleCode}`);
    return response.data;
  },

  suspendUser: async (userId: string): Promise<ApiResponse<UserWithStats>> => {
    const response = await api.post<ApiResponse<UserWithStats>>(`/admin/users/${userId}/suspend`);
    return response.data;
  },

  activateUser: async (userId: string): Promise<ApiResponse<UserWithStats>> => {
    const response = await api.post<ApiResponse<UserWithStats>>(`/admin/users/${userId}/activate`);
    return response.data;
  },

  deleteUser: async (userId: string): Promise<ApiResponse<any>> => {
    const response = await api.delete<ApiResponse<any>>(`/admin/users/${userId}`);
    return response.data;
  },

  // Reports
  getUserEngagementReport: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<UserEngagementReport>> => {
    const response = await api.get<ApiResponse<UserEngagementReport>>('/admin/reports/user-engagement', {
      params,
    });
    return response.data;
  },

  getQuizPerformanceReport: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<QuizPerformanceReport>> => {
    const response = await api.get<ApiResponse<QuizPerformanceReport>>('/admin/reports/quiz-performance', {
      params,
    });
    return response.data;
  },

  getLearningProgressReport: async (): Promise<ApiResponse<LearningProgressReport>> => {
    const response = await api.get<ApiResponse<LearningProgressReport>>('/admin/reports/learning-progress');
    return response.data;
  },

  exportUserData: async (): Promise<ApiResponse<any[]>> => {
    const response = await api.get<ApiResponse<any[]>>('/admin/reports/export/users');
    return response.data;
  },

  // Settings
  getSystemSettings: async (): Promise<ApiResponse<SystemSettingRow[]>> => {
    const response = await api.get<ApiResponse<unknown>>('/admin/settings');
    return {
      ...response.data,
      data: extractSystemSettingRows(response.data.data),
    };
  },

  updateSystemSetting: async (
    key: string,
    value: any,
    metadata?: Pick<UpsertSystemSettingPayload, 'type' | 'category' | 'isPublic'>,
  ): Promise<ApiResponse<SystemSettingRow>> => {
    const response = await api.put<ApiResponse<any>>(`/admin/settings/${key}`, {
      value,
      ...metadata,
    });
    return response.data;
  },

  createSystemSetting: async (
    data: UpsertSystemSettingPayload,
  ): Promise<ApiResponse<SystemSettingRow>> => {
    const { key, ...payload } = data;
    const response = await api.put<ApiResponse<any>>(`/admin/settings/${key}`, payload);
    return response.data;
  },

  deleteSystemSetting: async (key: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/admin/settings/${key}`);
    return response.data;
  },
};
