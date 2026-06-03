'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { tokenStorage } from '@/stores/token-storage';
import { authApi } from '@/features/auth/api/auth.api';
import { refreshAccessTokenOnce } from '@/services/api';

interface UseAuthBootstrapOptions {
  onUnauthenticated?: () => void;
  redirectTo?: string;
}

export function useAuthBootstrap(options: UseAuthBootstrapOptions = {}) {
  const { onUnauthenticated, redirectTo } = options;
  const router = useRouter();
  const { user, setUser, setIsLoading, setAuthReady, isLoading } = useAuthStore();
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    if (bootstrappedRef.current) {
      return;
    }

    bootstrappedRef.current = true;
    let cancelled = false;

    const bootstrap = async () => {
      setIsLoading(true);
      if (user && tokenStorage.hasAccessToken()) {
        setAuthReady(true);
        setIsLoading(false);
        return;
      }

      try {
        await refreshAccessTokenOnce();

        if (cancelled) {
          return;
        }

        const profileResponse = await authApi.getMe();
        if (cancelled) {
          return;
        }

        setUser(profileResponse.data);
        setAuthReady(true);
      } catch {
        if (cancelled) {
          return;
        }

        tokenStorage.clearAccessToken();
        setUser(null);
        setAuthReady(true);
        if (onUnauthenticated) {
          onUnauthenticated();
        } else if (redirectTo) {
          router.push(redirectTo);
        } else {
          setIsLoading(false);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [onUnauthenticated, redirectTo, router, setAuthReady, setIsLoading, setUser]);

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
