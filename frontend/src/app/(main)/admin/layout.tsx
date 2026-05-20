'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCurrentUser } from '@/features/auth/hooks/use-auth.hook';
import { useAuthStore } from '@/stores/auth.store';
import { useMenuStore } from '@/stores/menu.store';
import { AdminSidebar } from '@/components/sidebar/admin-sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { FileText, LayoutDashboard } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const setUser = useAuthStore((state) => state.setUser);
  const { menuItems, isLoading, fetchMenuForUser } = useMenuStore();

  console.log('Layout user', user);
  console.log('Layout menuItems', menuItems);
  useEffect(() => {
    if (user) {
      setUser(user);
      fetchMenuForUser();
    }
  }, [user, setUser, fetchMenuForUser]);

  useEffect(() => {
    if(menuItems.length === 0 || (user && user.roleCodes?.includes('admin'))) router.push('/not-found');
    if (menuItems.length > 0) {
      const hasAccess = menuItems.some(
        (item) => item.path.startsWith('/admin') || item.code.startsWith('admin-')
      );
      if (!hasAccess && pathname !== '/admin') {
        router.push('/not-found');
      }
    }
  }, [menuItems, pathname, router]);

  return (
    <div>
    { user && user.roleCodes?.includes('admin') && (
      <div className="min-h-screen bg-background">
      {/* Admin Header */}
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="h-6 w-6" />
                  Admin Panel
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage your platform from one place
                </p>
              </div>
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Back to App
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="flex gap-6">
            {/* Dynamic Admin Sidebar */}
            <AdminSidebar
              adminMenuItems={menuItems}
              isLoading={isLoading}
            />

            {/* Main Content */}
            <main className="flex-1 min-w-0">{children}</main>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
