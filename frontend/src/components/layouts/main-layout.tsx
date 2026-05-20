'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCurrentUser, useLogout } from '@/features/auth/hooks/use-auth.hook';
import { useAuthStore } from '@/stores/auth.store';
import { useMenuStore } from '@/stores/menu.store';
import { DynamicSidebar } from '@/components/sidebar/dynamic-sidebar';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  GraduationCap,
  LogOut,
  Settings,
  Trophy,
  User,
} from 'lucide-react';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const logoutMutation = useLogout();
  const setUser = useAuthStore((state) => state.setUser);
  const { menuItems, isLoading, fetchMenuForUser } = useMenuStore();

  useEffect(() => {
    if (user) {
      setUser(user);
      fetchMenuForUser();
    }
  }, [user, setUser, fetchMenuForUser]);

  useEffect(() => {
    if (menuItems.length > 0) {
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

      if (!checkPath(menuItems)) {
        router.push('/not-found');
      }
    }
  }, [menuItems, pathname, router]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Dynamic Sidebar */}
      <DynamicSidebar
        userMenuItems={menuItems}
        isLoading={isLoading}
        showUserSection={false}
      />

      {/* Main content */}
      <main className="flex-1">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card px-6">
          <button className="lg:hidden">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <NotificationBell />

            <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{user?.xp || 0} XP</span>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1">
              <span className="text-sm font-medium text-orange-600">
                {user?.streakDays || 0} day streak
              </span>
            </div>

            {/* User dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 rounded-full p-1 hover:bg-accent transition-colors">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
              </button>
              
              {/* Dropdown menu */}
              <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border bg-card shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="p-3 border-b">
                  <p className="text-sm font-medium">{user?.fullName || 'Loading...'}</p>
                  <p className="text-xs text-muted-foreground">Level {user?.level || 1}</p>
                </div>
                <div className="p-1">
                  <Link href="/settings">
                    <Button variant="ghost" className="w-full justify-start gap-2 text-sm">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950"
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                  >
                    <LogOut className="h-4 w-4" />
                    {logoutMutation.isPending ? 'Logging out...' : 'Log out'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
