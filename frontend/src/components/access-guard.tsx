'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMenuStore } from '@/stores/menu.store';
import { useAuthStore } from '@/stores/auth.store';

export function useHasAccess(path?: string): boolean {
  const pathname = path || usePathname();
  const { menuItems, fetchMenuForUser } = useMenuStore();
  const { isAuthenticated } = useAuthStore();
  const [hasAccess, setHasAccess] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const checkAccess = useCallback(async () => {
    if (!isAuthenticated) {
      setHasAccess(false);
      setIsChecking(false);
      return;
    }

    if (menuItems.length === 0) {
      try {
        await fetchMenuForUser();
      } catch (e) {
        setHasAccess(false);
        setIsChecking(false);
        return;
      }
    }

    const checkPath = (items: any[]): boolean => {
      for (const item of items) {
        if (item.path === pathname) {
          return true;
        }
        if (item.children && item.children.length > 0) {
          if (checkPath(item.children)) {
            return true;
          }
        }
      }
      return false;
    };

    setHasAccess(checkPath(menuItems));
    setIsChecking(false);
  }, [pathname, isAuthenticated, menuItems.length, fetchMenuForUser]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return !isChecking && hasAccess;
}

interface AccessGuardProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

export function AccessGuard({ children, fallbackPath = '/not-found' }: AccessGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const hasAccess = useHasAccess();

  useEffect(() => {
    if (!hasAccess && pathname !== '/not-found') {
      router.push(fallbackPath);
    }
  }, [hasAccess, pathname, router, fallbackPath]);

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}
