'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { tokenStorage } from '@/stores/token-storage';
import { toast } from 'sonner';

export default function GoogleCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const setIsLoading = useAuthStore((state) => state.setIsLoading);

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const expiresIn = searchParams.get('expires_in');

    if (!accessToken) {
      toast.error('Google authentication failed');
      router.push('/login');
      return;
    }

    tokenStorage.setAccessToken(accessToken);
    setIsLoading(false);

    const fetchUser = async () => {
      try {
        const profileResponse = await authApi.getMe();
        setUser(profileResponse.data);
        toast.success('Welcome! You have successfully logged in with Google.');
        router.push('/dashboard');
      } catch {
        toast.error('Failed to fetch user profile');
        router.push('/login');
      }
    };

    fetchUser();
  }, [searchParams, router, setUser, setIsLoading]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Completing Google sign in...</p>
      </div>
    </div>
  );
}
