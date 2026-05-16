import { api, ApiResponse } from '@/services/api';

export interface LeaderboardEntry {
  rank: number;
  id: string;
  fullName: string;
  avatarUrl?: string;
  level: number;
  xp: number;
  streakDays: number;
}

export interface UserStats {
  dailyStats: {
    id: string;
    date: string;
    learnedWords: number;
    flashcardsReviewed: number;
    quizzesCompleted: number;
    studyMinutes: number;
    xpEarned: number;
  }[];
  total: {
    learnedWords: number | null;
    flashcardsReviewed: number | null;
    quizzesCompleted: number | null;
    studyMinutes: number | null;
    xpEarned: number | null;
  };
}

export const analyticsApi = {
  getLeaderboard: async (type: 'global' | 'weekly' | 'monthly' = 'global'): Promise<ApiResponse<LeaderboardEntry[]>> => {
    const response = await api.get<ApiResponse<LeaderboardEntry[]>>('/analytics/leaderboard', {
      params: { type },
    });
    return response.data;
  },

  getUserStats: async (): Promise<ApiResponse<UserStats>> => {
    const response = await api.get<ApiResponse<UserStats>>('/analytics/stats');
    return response.data;
  },
};
