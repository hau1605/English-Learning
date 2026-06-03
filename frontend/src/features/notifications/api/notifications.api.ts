import { api, ApiResponse } from '@/services/api';

export interface Notification {
  id: string;
  userId: string;
  notificationId: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  notification?: {
    id: string;
    type: string;
    title: string;
    content: string;
    data?: any;
  };
}

export interface PaginatedData<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const notificationsApi = {
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<ApiResponse<PaginatedData<Notification>>> => {
    const response = await api.get<ApiResponse<PaginatedData<Notification>>>('/notifications', { params });
    return response.data;
  },

  getUnreadCount: async (): Promise<ApiResponse<{ count: number }>> => {
    const response = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (notificationId: string): Promise<ApiResponse<void>> => {
    const response = await api.patch<ApiResponse<void>>(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>('/notifications/read-all');
    return response.data;
  },

  deleteNotification: async (notificationId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/notifications/${notificationId}`);
    return response.data;
  },
};
