'use client';

import { useEffect, useState } from 'react';
import { useAuthBootstrap } from '@/features/auth/hooks/use-auth-bootstrap.hook';
import { useAuthStore } from '@/stores/auth.store';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [mounted, setMounted] = useState(false);

  const { isLoading, authReady } = useAuthStore();

  useAuthBootstrap();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading || !authReady) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
