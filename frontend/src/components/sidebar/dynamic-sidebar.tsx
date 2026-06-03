'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils';
import { useAuthStore } from '@/stores/auth.store';
import { MenuItem } from '@/features/menu/api/menu.api';
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  ScrollText,
  Mic,
  Sparkles,
  Trophy,
  BarChart3,
  Shield,
  Users,
  Settings,
  StickyNote,
  FileQuestion,
  Menu,
  Loader2,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  ScrollText,
  Mic,
  Sparkles,
  Trophy,
  BarChart3,
  Shield,
  Users,
  Settings,
  StickyNote,
  FileQuestion,
  Menu,
};

interface MenuItemComponentProps {
  item: MenuItem;
  level?: number;
}

function MenuItemComponent({ item, level = 0 }: MenuItemComponentProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = pathname === item.path || pathname.startsWith(item.path + '/');

  const IconComponent = item.icon ? iconMap[item.icon] : null;

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="w-full">
      {hasChildren ? (
        <>
          <button
            onClick={handleClick}
            className={cn(
              'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-accent',
              level > 0 && 'ml-4 text-sm'
            )}
          >
            <div className="flex items-center gap-3">
              {IconComponent && <IconComponent className="h-5 w-5" />}
              <span>{item.label}</span>
            </div>
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {isOpen && (
            <div className="mt-1 space-y-1">
              {item.children.map((child) => (
                <MenuItemComponent key={child.id} item={child} level={level + 1} />
              ))}
            </div>
          )}
        </>
      ) : (
        <Link
          href={item.path}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            isActive
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground hover:bg-accent',
            level > 0 && 'ml-4 text-sm'
          )}
        >
          {IconComponent && <IconComponent className="h-5 w-5" />}
          <span>{item.label}</span>
        </Link>
      )}
    </div>
  );
}

interface DynamicSidebarProps {
  userMenuItems: MenuItem[];
  isLoading?: boolean;
  showUserSection?: boolean;
}

export function DynamicSidebar({
  userMenuItems,
  isLoading = false,
  showUserSection = true,
}: DynamicSidebarProps) {
  const user = useAuthStore((state) => state.user);

  const isAdminSection = (item: MenuItem) => {
    return item.code.startsWith('admin-') || item.path.startsWith('/admin');
  };

  const userItems = userMenuItems.filter(
    (item) => !isAdminSection(item) && !item.parentId
  );
  const adminItems = userMenuItems.filter(
    (item) => isAdminSection(item) && !item.parentId
  );

  if (isLoading) {
    return (
      <aside className="hidden w-64 flex-col bg-card lg:flex">
        <div className="flex h-16 items-center border-b px-6">
          <span className="text-xl font-bold">Loading...</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden w-64 flex-col bg-card lg:flex border-r">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">EnglishPro</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {userItems.map((item) => (
          <MenuItemComponent key={item.id} item={item} />
        ))}

        {adminItems.length > 0 && (
          <>
            <div className="my-4 border-t" />
            <p className="px-3 text-xs font-semibold uppercase text-muted-foreground">
              Admin
            </p>
            {adminItems.map((item) => (
              <MenuItemComponent key={item.id} item={item} />
            ))}
          </>
        )}
      </nav>

      {showUserSection && (
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{user?.fullName || 'Loading...'}</p>
              <p className="text-xs text-muted-foreground">Level {user?.level || 1}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/settings">
              <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">
                <Settings className="h-4 w-4" />
                Settings
              </button>
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}
