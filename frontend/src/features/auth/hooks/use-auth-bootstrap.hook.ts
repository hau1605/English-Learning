'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { tokenStorage } from '@/stores/token-storage';
import { authApi } from '@/features/auth/api/auth.api';

interface UseAuthBootstrapOptions {
  onUnauthenticated?: () => void;
  redirectTo?: string;
}

export function useAuthBootstrap(options: UseAuthBootstrapOptions = {}) {
  const { onUnauthenticated, redirectTo } = options;
  const router = useRouter();
  const { user, setUser, setIsLoading, isLoading } = useAuthStore();

  useEffect(() => {
    const bootstrap = async () => {
      if (user && tokenStorage.hasAccessToken()) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.refreshToken();
        const { accessToken } = response.data;

        tokenStorage.setAccessToken(accessToken);

        const profileResponse = await authApi.getMe();
        setUser(profileResponse.data);
      } catch {
        tokenStorage.clearAccessToken();
        setUser(null);
        
        if (onUnauthenticated) {
          onUnauthenticated();
        } else if (redirectTo) {
          router.push(redirectTo);
        }
      }
    };

    bootstrap();
  }, [onUnauthenticated, redirectTo, router, setIsLoading, setUser, user]);

  return { isLoading };
}

export function useAuthGuard(redirectTo = '/login') {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(redirectTo);
    }
  }, [isLoading, user, router, redirectTo]);

  return { user, isLoading };
}
