'use client';

import { useEffect, useCallback } from 'react';
import { useThemeStore, applyTheme, ResolvedTheme } from '@/stores/theme.store';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { resolvedTheme, setTheme, theme } = useThemeStore();

  const handleSystemThemeChange = useCallback(
    (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        const newResolvedTheme: ResolvedTheme = e.matches ? 'dark' : 'light';
        useThemeStore.setState({ resolvedTheme: newResolvedTheme });
        applyTheme(newResolvedTheme);
      }
    },
    [theme]
  );

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [handleSystemThemeChange]);

  return <>{children}</>;
}
