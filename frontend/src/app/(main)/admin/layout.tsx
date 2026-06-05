'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useMenuStore } from '@/stores/menu.store';
import { AdminSidebar } from '@/components/sidebar/admin-sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  Search,
  Settings,
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, authReady, isLoading: authLoading } = useAuthStore();
  const { menuItems, isLoading: menuLoading, hasLoaded, fetchMenuForUser } = useMenuStore();
  const retriedMissingAdminChildren = useRef(false);

  const hasAdminRole = user?.roleCodes?.some((role) =>
    ['admin', 'super_admin'].includes(role)
  );
  const hasAdminMenuAccess = menuItems.some(
    (item) => item.path.startsWith('/admin') || item.code.startsWith('admin-')
  );
  const canAccessAdmin = Boolean(hasAdminRole || hasAdminMenuAccess);
  const displayName = user?.fullName || 'Admin';
  const displayEmail = user?.email || 'Quan tri';

  useEffect(() => {
    if (user && !hasLoaded && !menuLoading) {
      fetchMenuForUser();
    }
  }, [user, hasLoaded, menuLoading, fetchMenuForUser]);

  useEffect(() => {
    const adminRoot = menuItems.find((item) => item.code === 'admin-dashboard');

    if (user && hasLoaded && adminRoot && adminRoot.children.length === 0 && !retriedMissingAdminChildren.current) {
      retriedMissingAdminChildren.current = true;
      fetchMenuForUser({ force: true });
    }
  }, [fetchMenuForUser, hasLoaded, menuItems, user]);

  useEffect(() => {
    if (hasLoaded && !canAccessAdmin) {
      router.push(authReady && !user ? '/login' : '/not-found');
    }
  }, [authReady, canAccessAdmin, hasLoaded, router, user]);

  if (!authReady || authLoading || !user || !hasLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      {canAccessAdmin && (
        <div className="min-h-screen bg-[#f7f9fc] text-slate-900 dark:bg-background dark:text-foreground">
          <div className="flex min-h-screen">
            <AdminSidebar adminMenuItems={menuItems} isLoading={menuLoading} />

            <div className="flex min-w-0 flex-1 flex-col">
              <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur dark:border-border dark:bg-card/95">
                <div className="flex h-[50px] items-center justify-between gap-4 px-4 sm:px-6">
                  <div className="hidden min-w-0 flex-1 items-center md:flex">
                    <div className="relative w-full max-w-md">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        aria-label="Tìm kiếm nhanh"
                        className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 dark:border-border dark:bg-background"
                        placeholder="Tìm kiếm nhanh..."
                        type="search"
                      />
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-1 items-center gap-2 md:hidden">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-white text-sm font-bold text-blue-700 shadow-sm">
                      E
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">Admin</p>
                      <p className="truncate text-xs text-slate-500">
                        English Learning
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <ThemeToggle className="h-10 w-10 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-muted" />
                    <button
                      type="button"
                      className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-muted dark:text-muted-foreground"
                      aria-label="Thong bao"
                    >
                      <Bell className="h-4 w-4" />
                      <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                        3
                      </span>
                    </button>
                    <Link
                      href="/dashboard"
                      className="hidden h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:border-blue-200 hover:text-blue-700 dark:border-border dark:bg-background dark:text-muted-foreground sm:flex"
                    >
                      <LayoutDashboard className="h-4 w-4 shrink-0" />
                      Về trang chủ
                    </Link>
                    <Link
                      href="/admin/settings"
                      className="hidden h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-muted dark:text-muted-foreground sm:flex"
                      aria-label="Thiet lap"
                    >
                      <Settings className="h-4 w-4" />
                    </Link>
                    <div className="flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 shadow-sm dark:border-border dark:bg-background">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-semibold text-white">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="hidden min-w-0 sm:block">
                        <p className="max-w-[140px] truncate text-sm font-semibold">
                          {displayName}
                        </p>
                        <p className="max-w-[140px] truncate text-xs text-slate-500">
                          {displayEmail}
                        </p>
                      </div>
                      <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
                    </div>
                  </div>
                </div>
              </header>

              <main className="min-w-0 flex-1 overflow-hidden px-4 py-5 sm:px-6">
                {children}
              </main>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
