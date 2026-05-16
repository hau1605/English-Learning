"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils";
import { MenuItem } from "@/features/menu/api/menu.api";
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Shield,
  Users,
  BookOpen,
  GraduationCap,
  ScrollText,
  BarChart3,
  Settings,
  FileText,
  Menu,
  Loader2,
  LayoutDashboard as DashboardIcon,
  Zap,
} from "lucide-react";
import * as LucideIcons from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  ScrollText,
  BarChart3,
  Shield,
  Users,
  Settings,
  Menu,
  DashboardIcon,
};

interface MenuItemComponentProps {
  item: MenuItem;
  level?: number;
}

function AdminMenuItem({ item, level = 0 }: MenuItemComponentProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  const isActive =
    pathname === item.path ||
    (item.path !== "/admin" && pathname.startsWith(item.path));

  const IconComponent = item.icon ? iconMap[item.icon] : null;

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
  };

  if (hasChildren) {
    return (
      <div className="w-full">
        <button
          onClick={handleClick}
          className={cn(
            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
            level > 0 && "ml-4 text-sm",
          )}
        >
          <div className="flex items-center gap-3">
            {IconComponent && <IconComponent className="h-4 w-4" />}
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
              <AdminMenuItem key={child.id} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.path}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        level > 0 && "ml-4 text-sm",
      )}
    >
      {IconComponent && <IconComponent className="h-4 w-4" />}
      <span>{item.label}</span>
    </Link>
  );
}

interface AdminSidebarProps {
  adminMenuItems: MenuItem[];
  isLoading?: boolean;
}

export function AdminSidebar({
  adminMenuItems,
  isLoading = false,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const adminItems = adminMenuItems.filter(
    (item) => item.code.startsWith("admin-") || item.path.startsWith("/admin"),
  );

  const isQueueActive =
    pathname === "/admin/queues" || pathname.startsWith("/admin/queues/");

  if (isLoading) {
    return (
      <aside className="w-64 shrink-0">
        <div className="flex h-32 items-center justify-center rounded-lg border bg-white p-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 shrink-0">
      <nav className="sticky top-6 space-y-1 bg-white rounded-lg border p-2">
        {adminItems.map((item) => (
          <AdminMenuItem key={item.id} item={item} />
        ))}

        {/* Static Queue Monitoring Link */}
        <div className="border-t my-2 pt-2">
          <Link
            href="/admin/queues"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isQueueActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Zap className="h-4 w-4" />
            <span>Queue Monitor</span>
          </Link>
        </div>
      </nav>
    </aside>
  );
}
