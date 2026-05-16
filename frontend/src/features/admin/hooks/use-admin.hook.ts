'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  adminApi, 
  DashboardStats, 
  RecentActivity, 
  UserWithStats,
  AnalyticsOverview,
  UserEngagementReport,
  QuizPerformanceReport,
  LearningProgressReport,
  SystemSettings,
  PaginatedData,
} from '@/features/admin/api/admin.api';
import { toast } from 'sonner';

export type { UserWithStats, PaginatedData };

// Dashboard hooks
export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: adminApi.getDashboardStats,
    refetchInterval: 30000,
  });
}

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ['admin', 'analytics', 'overview'],
    queryFn: adminApi.getAnalyticsOverview,
    refetchInterval: 60000,
  });
}

export function useRecentActivity(limit?: number) {
  return useQuery({
    queryKey: ['admin', 'activity', limit],
    queryFn: () => adminApi.getRecentActivity(limit),
  });
}

// User Management hooks
export function useAdminUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminApi.getUsers(params),
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roleCode }: { userId: string; roleCode: string }) =>
      adminApi.assignRole(userId, roleCode),
    onSuccess: () => {
      toast.success('Role assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to assign role';
      toast.error(message);
    },
  });
}

export function useRemoveRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roleCode }: { userId: string; roleCode: string }) =>
      adminApi.removeRole(userId, roleCode),
    onSuccess: () => {
      toast.success('Role removed successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to remove role';
      toast.error(message);
    },
  });
}

export function useSuspendUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => adminApi.suspendUser(userId),
    onSuccess: () => {
      toast.success('User suspended successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to suspend user';
      toast.error(message);
    },
  });
}

export function useActivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => adminApi.activateUser(userId),
    onSuccess: () => {
      toast.success('User activated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to activate user';
      toast.error(message);
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => adminApi.deleteUser(userId),
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete user';
      toast.error(message);
    },
  });
}

// Reports hooks
export function useUserEngagementReport(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['admin', 'reports', 'user-engagement', params],
    queryFn: () => adminApi.getUserEngagementReport(params),
  });
}

export function useQuizPerformanceReport(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['admin', 'reports', 'quiz-performance', params],
    queryFn: () => adminApi.getQuizPerformanceReport(params),
  });
}

export function useLearningProgressReport() {
  return useQuery({
    queryKey: ['admin', 'reports', 'learning-progress'],
    queryFn: adminApi.getLearningProgressReport,
  });
}

export function useExportUserData() {
  return useMutation({
    mutationFn: adminApi.exportUserData,
    onSuccess: (data) => {
      toast.success('Data exported successfully');
      // Create download
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'user-data-export.json';
      a.click();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to export data';
      toast.error(message);
    },
  });
}

// Settings hooks
export function useSystemSettings() {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: adminApi.getSystemSettings,
  });
}

export function useUpdateSystemSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: any }) =>
      adminApi.updateSystemSetting(key, value),
    onSuccess: () => {
      toast.success('Setting updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update setting';
      toast.error(message);
    },
  });
}
