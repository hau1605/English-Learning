'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils';
import { useAuthStore } from '@/stores/auth.store';
import { MenuItem } from '@/features/menu/api/menu.api';
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
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
  collapsed?: boolean;
  onHover?: (item: MenuItem, rect: DOMRect) => void;
  onLeave?: () => void;
}

function MenuItemComponent({ item, level = 0, collapsed = false, onHover, onLeave }: MenuItemComponentProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLElement | null>(null);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = pathname === item.path || pathname.startsWith(item.path + '/');

  const IconComponent = item.icon ? iconMap[item.icon] : null;
  const iconClassName = cn('h-5 w-5', isActive && 'text-primary');

  const handleClick = () => {
    if (hasChildren) setIsOpen((v) => !v);
  };

  // When item has children
  // ref used to calculate popover position

  if (hasChildren) {
    if (collapsed) {
      return (
        <div className="w-full">
          <button
            ref={ref as any}
            title={item.label}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onMouseEnter={() => {
              if (ref?.current && onHover) {
                const rect = ref.current.getBoundingClientRect();
                onHover(item, rect);
              }
            }}
            onMouseLeave={() => onLeave && onLeave()}
            className={cn(
              'flex w-full items-center justify-center rounded-md p-2 text-sm font-medium transition-colors',
              isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent',
              level > 0 && 'ml-4 text-sm'
            )}
          >
            {IconComponent && <IconComponent className="h-5 w-5" />}
          </button>
        </div>
      );
    }

    return (
      <div className="w-full">
        <div className={cn('relative w-full', level > 0 && 'ml-4')}>
          {isActive && (
            <span style={{ left: -8 }} className="absolute rounded-r bg-primary" />
          )}
          <button
            onClick={handleClick}
            className={cn(
              'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent'
            )}
          >
            <div className="flex items-center gap-3">
              {IconComponent && <IconComponent className={iconClassName} />}
              <span>{item.label}</span>
            </div>
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        {isOpen && (
          <div className="mt-1 space-y-1">
            {item.children.map((child) => (
              <MenuItemComponent key={child.id} item={child} level={level + 1} collapsed={collapsed} onHover={onHover} onLeave={onLeave} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // No children
  if (collapsed) {
    return (
      <div className="w-full">
        <div
          ref={ref as any}
          title={item.label}
          onMouseEnter={() => {
            if (ref?.current && onHover) {
              const rect = ref.current.getBoundingClientRect();
              onHover(item, rect);
            }
          }}
          onMouseLeave={() => onLeave && onLeave()}
          className={cn(
            'flex items-center justify-center rounded-md p-2 transition-colors',
            isActive ? 'bg-primary/10' : 'hover:bg-accent',
            level > 0 && 'ml-4'
          )}
        >
          <Link href={item.path} className="flex w-full items-center justify-center p-0">
            {IconComponent && <IconComponent className={iconClassName} />}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative w-full', level > 0 && 'ml-4')}>
      {isActive && <span style={{ left: -8 }} className="absolute rounded-r bg-primary" />}
      <Link
        href={item.path}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent'
        )}
      >
        {IconComponent && <IconComponent className={iconClassName} />}
        <span>{item.label}</span>
      </Link>
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
  const [collapsed, setCollapsed] = useState(false);
  // load persisted collapsed state on mount (but only write when user toggles)
  useEffect(() => {
    try {
      const v = localStorage.getItem('elp_sidebar_collapsed');
      if (v !== null) setCollapsed(v === '1');
    } catch (e) {
      /* ignore */
    }
  }, []);

  // helper to toggle and persist only when user explicitly toggles
  const toggleCollapsed = (val?: boolean) => {
    setCollapsed((prev) => {
      const next = typeof val === 'boolean' ? val : !prev;
      try {
        localStorage.setItem('elp_sidebar_collapsed', next ? '1' : '0');
      } catch (e) {
        /* ignore */
      }
      return next;
    });
  };
  const [hovered, setHovered] = useState<{ item: MenuItem | null; rect?: { top: number; left: number; right: number; height: number } | null } | null>(null);
  const hoverCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popoverPanelRef = useRef<HTMLDivElement | null>(null);
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});

  const clearHoverCloseTimer = () => {
    if (hoverCloseTimer.current) {
      clearTimeout(hoverCloseTimer.current);
      hoverCloseTimer.current = null;
    }
  };

  const handleHover = (item: MenuItem, rect: DOMRect) => {
    clearHoverCloseTimer();
    setHovered({ item, rect: { top: rect.top, left: rect.left, right: rect.right, height: rect.height } });
  };

  const handleLeave = () => {
    clearHoverCloseTimer();
    hoverCloseTimer.current = setTimeout(() => {
      setHovered(null);
    }, 140);
  };

  const handlePopoverEnter = () => {
    clearHoverCloseTimer();
  };

  const handlePopoverLeave = () => {
    clearHoverCloseTimer();
    setHovered(null);
  };

  useEffect(() => {
    if (!hovered) {
      setPopoverVisible(false);
      return;
    }

    setPopoverVisible(false);
    const frame = requestAnimationFrame(() => {
      setPopoverVisible(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [hovered]);

  useLayoutEffect(() => {
    if (!collapsed || !hovered?.rect || !hovered.item?.children?.length) {
      return;
    }

    const rect = hovered.rect;
    const viewportHeight = window.innerHeight || 0;
    const panelHeight = popoverPanelRef.current?.offsetHeight || 280;
    const gap = 6;
    const top = Math.max(8, Math.min(rect.top - 8, viewportHeight - panelHeight - 8));

    setPopoverStyle({
      position: 'fixed',
      left: `${rect.right + gap}px`,
      top: `${top}px`,
      maxHeight: `calc(100vh - 16px)`,
    });
  }, [collapsed, hovered]);

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
      <aside className={cn('hidden flex-col bg-card lg:flex', collapsed ? 'w-20' : 'w-64')}>
        <div className="flex h-10 items-center border-b px-3">
          <span className="text-xl font-bold">Loading...</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </aside>
    );
  }

  return (
    <aside className={cn('hidden flex-col bg-card lg:flex border-r', collapsed ? 'w-20' : 'w-64')}>
      <div className="flex h-10 items-center border-b px-3 justify-between">
        <Link href="/dashboard" className={cn('flex items-center gap-2', collapsed && 'justify-center w-full')}>
          <GraduationCap className="h-8 w-8 text-primary" />
          {!collapsed && <span className="text-xl font-bold">EnglishPro</span>}
        </Link>
        <button
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => toggleCollapsed()}
          className="ml-2 rounded p-2 text-foreground hover:bg-accent"
        >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-1 py-1">
        {userItems.map((item) => (
          <MenuItemComponent key={item.id} item={item} collapsed={collapsed} onHover={handleHover} onLeave={handleLeave} />
        ))}

        {adminItems.length > 0 && (
          <>
            <div className="my-4 border-t" />
            <p className="px-3 text-xs font-semibold uppercase text-muted-foreground">
              Admin
            </p>
            {adminItems.map((item) => (
              <MenuItemComponent key={item.id} item={item} collapsed={collapsed} onHover={handleHover} onLeave={handleLeave} />
            ))}
          </>
        )}
      </nav>

      {/* Popover for collapsed sidebar showing children of hovered parent */}
      {collapsed && hovered && hovered.item && (
        (() => {
          const rect = hovered.rect;
          const isSmall = typeof window !== 'undefined' ? window.innerWidth < 640 : false;

          // If item has children -> full popover panel
          if (hovered.item.children && hovered.item.children.length) {
            const mobileStyle: CSSProperties | undefined = rect
              ? {
                  position: 'fixed',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  top: `${Math.max(60, rect.top - 12)}px`,
                  width: 'min(90vw, 320px)',
                  maxHeight: 'calc(100vh - 16px)',
                }
              : { position: 'fixed', left: '50%', transform: 'translateX(-50%)', top: '20%' };

            const style: CSSProperties = isSmall
              ? mobileStyle
              : {
                  ...popoverStyle,
                  width: 'max-content',
                };

            return (
              <div style={style} className="z-50" onMouseEnter={handlePopoverEnter} onMouseLeave={handlePopoverLeave}>
                <div
                  ref={popoverPanelRef}
                  className={cn(
                    'min-w-[200px] max-w-xs bg-white dark:bg-card border rounded-lg shadow-lg p-3 overflow-y-auto transition-all duration-200 ease-out',
                    popoverVisible ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-2 scale-95'
                  )}
                >
                  {hovered.item.children.map((c) => (
                    <Link key={c.id} href={c.path} className="block px-3 py-2 text-sm text-foreground hover:bg-accent rounded">
                      {c.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          }

          // Otherwise show a small tooltip with the label
          if (!rect) return null;

          const tipStyle: CSSProperties = isSmall
            ? { position: 'fixed', left: '50%', transform: 'translateX(-50%) translateY(-50%)', top: `${rect.top + rect.height / 2}px` }
            : { position: 'fixed', left: `${rect.right + 8}px`, top: `${rect.top + rect.height / 2}px`, transform: 'translateY(-50%)' };

          return (
            <div style={tipStyle} className="z-50" onMouseEnter={handlePopoverEnter} onMouseLeave={handlePopoverLeave}>
              <div className={cn('bg-black text-white text-sm rounded-md px-3 py-2 shadow transition-all duration-150 ease-out', popoverVisible ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-1 scale-95')}>
                {hovered.item.label}
              </div>
            </div>
          );
        })()
      )}

      {showUserSection && (
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            {!collapsed && (
              <div className="flex-1">
                <p className="text-sm font-medium">{user?.fullName || 'Loading...'}</p>
                <p className="text-xs text-muted-foreground">Level {user?.level || 1}</p>
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/settings">
              <button className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent', collapsed && 'justify-center')}>
                <Settings className="h-4 w-4" />
                {!collapsed && 'Settings'}
              </button>
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}

// Fallback icon when ChevronLeft isn't imported above
function ChevronLeftIconFallback(props: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={cn('h-4 w-4', props.className ?? '')}><path d="M15 18l-6-6 6-6"/></svg>;
}
