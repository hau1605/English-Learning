'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi, LoginRequest, RegisterRequest } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { useMenuStore } from '@/stores/menu.store';
import { tokenStorage } from '@/stores/token-storage';
import { toast } from 'sonner';

export function useLogin() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const setAuthReady = useAuthStore((state) => state.setAuthReady);
  const setIsLoading = useAuthStore((state) => state.setIsLoading);

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: async (response) => {
      const { accessToken } = response.data;

      tokenStorage.setAccessToken(accessToken);
      setAuthReady(true);
      setIsLoading(false);

      try {
        const profileResponse = await authApi.getMe();
        setUser(profileResponse.data);
        toast.success('Welcome back!');
        router.push('/dashboard');
      } catch {
        toast.error('Failed to fetch profile');
        router.push('/dashboard');
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
    },
  });
}

export function useRegister() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const setAuthReady = useAuthStore((state) => state.setAuthReady);
  const setIsLoading = useAuthStore((state) => state.setIsLoading);

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: async (response) => {
      const { accessToken } = response.data;

      tokenStorage.setAccessToken(accessToken);
      setAuthReady(true);
      setIsLoading(false);

      try {
        const profileResponse = await authApi.getMe();
        setUser(profileResponse.data);
        toast.success('Account created successfully!');
        router.push('/dashboard');
      } catch {
        router.push('/dashboard');
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);
  const setAuthReady = useAuthStore((state) => state.setAuthReady);
  const clearMenu = useMenuStore((state) => state.clearMenu);

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      tokenStorage.clearAccessToken();
      setAuthReady(true);
      logout();
      clearMenu();
      queryClient.clear();
      toast.success('Logged out successfully');
      router.push('/login');
    },
    onError: () => {
      tokenStorage.clearAccessToken();
      setAuthReady(true);
      logout();
      clearMenu();
      router.push('/login');
    },
  });
}

export function useCurrentUser() {
  const setUser = useAuthStore((state) => state.setUser);
  const authReady = useAuthStore((state) => state.authReady);
  const hasToken = tokenStorage.hasAccessToken();

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await authApi.getMe();
      const userData = response.data;
      setUser(userData);
      return userData;
    },
    enabled: authReady && hasToken,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
