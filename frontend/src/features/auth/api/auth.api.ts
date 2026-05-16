import { api, ApiResponse } from '@/services/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  userId: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  level: number;
  xp: number;
  streakDays: number;
  status: string;
  roleCodes?: string[];
}

export const authApi = {
  login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>('/auth/logout');
    return response.data;
  },

  logoutAll: async (): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>('/auth/logout-all');
    return response.data;
  },

  refreshToken: async (): Promise<ApiResponse<{ accessToken: string; expiresIn: number }>> => {
    const response = await api.post('/auth/refresh');
    return response.data;
  },

  getMe: async (): Promise<ApiResponse<UserProfile>> => {
    const response = await api.get<ApiResponse<UserProfile>>('/users/me');
    return response.data;
  },

  getSessions: async (): Promise<ApiResponse<Session[]>> => {
    const response = await api.get<ApiResponse<Session[]>>('/auth/sessions');
    return response.data;
  },

  revokeSession: async (sessionId: string): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>(`/auth/sessions/${sessionId}/revoke`);
    return response.data;
  },
};

export interface Session {
  id: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  expiresAt: string;
}
