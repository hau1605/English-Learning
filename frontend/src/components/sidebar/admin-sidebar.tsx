"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils";
import { MenuItem } from "@/features/menu/api/menu.api";
import {
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  CircleDollarSign,
  FileQuestion,
  GraduationCap,
  LayoutDashboard,
  KeyRound,
  Loader2,
  Megaphone,
  Package,
  ScrollText,
  Settings,
  Shield,
  SlidersHorizontal,
  Users,
  Zap,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  KeyRound,
  GraduationCap,
  BookOpen,
  ScrollText,
  BarChart3,
  Shield,
  Users,
  Settings,
  Megaphone,
  BriefcaseBusiness,
  Package,
  CalendarDays,
  CircleDollarSign,
  FileQuestion,
  Bell,
  SlidersHorizontal,
  Zap,
};

const fallbackItems: MenuItem[] = [
  {
    id: "admin-dashboard-fallback",
    code: "admin-dashboard",
    label: "Tong quan",
    path: "/admin",
    icon: "LayoutDashboard",
    parentId: null,
    orderIndex: 1,
    isActive: true,
    roles: [],
    createdAt: "",
    updatedAt: "",
    children: [],
  },
  {
    id: "admin-content-fallback",
    code: "admin-content",
    label: "Noi dung hoc",
    path: "/admin/sections",
    icon: "BookOpen",
    parentId: null,
    orderIndex: 2,
    isActive: true,
    roles: [],
    createdAt: "",
    updatedAt: "",
    children: [
      {
        id: "admin-sections-fallback",
        code: "admin-sections",
        label: "Khoa hoc",
        path: "/admin/sections",
        icon: "GraduationCap",
        parentId: "admin-content-fallback",
        orderIndex: 1,
        isActive: true,
        roles: [],
        createdAt: "",
        updatedAt: "",
        children: [],
      },
      {
        id: "admin-vocabulary-fallback",
        code: "admin-vocabulary",
        label: "Tu vung",
        path: "/admin/vocabulary",
        icon: "BookOpen",
        parentId: "admin-content-fallback",
        orderIndex: 2,
        isActive: true,
        roles: [],
        createdAt: "",
        updatedAt: "",
        children: [],
      },
      {
        id: "admin-flashcards-fallback",
        code: "admin-flashcards",
        label: "Flashcards",
        path: "/admin/flashcards",
        icon: "ScrollText",
        parentId: "admin-content-fallback",
        orderIndex: 3,
        isActive: true,
        roles: [],
        createdAt: "",
        updatedAt: "",
        children: [],
      },
      {
        id: "admin-quizzes-fallback",
        code: "admin-quizzes",
        label: "Bai kiem tra",
        path: "/admin/quizzes",
        icon: "FileQuestion",
        parentId: "admin-content-fallback",
        orderIndex: 4,
        isActive: true,
        roles: [],
        createdAt: "",
        updatedAt: "",
        children: [],
      },
    ],
  },
  {
    id: "admin-users-fallback",
    code: "admin-users",
    label: "Nhan su",
    path: "/admin/users",
    icon: "Users",
    parentId: null,
    orderIndex: 3,
    isActive: true,
    roles: [],
    createdAt: "",
    updatedAt: "",
    children: [],
  },
  {
    id: "admin-reports-fallback",
    code: "admin-reports",
    label: "Bao cao",
    path: "/admin/reports",
    icon: "BarChart3",
    parentId: null,
    orderIndex: 4,
    isActive: true,
    roles: [],
    createdAt: "",
    updatedAt: "",
    children: [],
  },
  {
    id: "admin-settings-fallback",
    code: "admin-settings",
    label: "Thiet lap",
    path: "/admin/settings",
    icon: "Settings",
    parentId: null,
    orderIndex: 5,
    isActive: true,
    roles: [],
    createdAt: "",
    updatedAt: "",
    children: [],
  },
  {
    id: "admin-roles-fallback",
    code: "admin-roles",
    label: "Roles & Permissions",
    path: "/admin/roles",
    icon: "KeyRound",
    parentId: null,
    orderIndex: 6,
    isActive: true,
    roles: [],
    createdAt: "",
    updatedAt: "",
    children: [],
  },
];

interface MenuItemComponentProps {
  item: MenuItem;
  level?: number;
  collapsed?: boolean;
}

function AdminMenuItem({ item, level = 0, collapsed = false }: MenuItemComponentProps) {
  const pathname = usePathname();
  const hasChildren = item.children && item.children.length > 0;
  const isActive =
    pathname === item.path ||
    (item.path !== "/admin" && pathname.startsWith(item.path));
  const hasActiveChild = Boolean(
    item.children?.some(
      (child) =>
        pathname === child.path ||
        (child.path !== "/admin" && pathname.startsWith(child.path)),
    ),
  );
  const [isOpen, setIsOpen] = useState(isActive || hasActiveChild);
  const IconComponent = item.icon ? iconMap[item.icon] || LayoutDashboard : LayoutDashboard;

  const iconClassName = cn(
    "h-4 w-4 shrink-0",
    isActive || hasActiveChild ? "text-blue-700 dark:text-primary" : ""
  );

  if (collapsed) {
    return (
      <div className="w-full">
        <Link
          href={item.path}
          title={item.label}
          className={cn(
            "flex h-10 items-center justify-center rounded-md px-2 transition-colors",
            isActive || hasActiveChild
              ? "bg-blue-50 text-blue-700 dark:bg-primary/15 dark:text-primary"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground",
            level > 0 && "ml-3 h-9 w-[calc(100%-0.75rem)]"
          )}
        >
          <IconComponent className={iconClassName} />
        </Link>
      </div>
    );
  }

  if (hasChildren) {
    return (
      <div className="w-full">
        <button
          onClick={() => setIsOpen((open) => !open)}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md px-3 text-sm font-medium transition-colors",
            isActive || hasActiveChild
              ? "bg-blue-50 text-blue-700 dark:bg-primary/15 dark:text-primary"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground",
            level > 0 && "ml-3 w-[calc(100%-0.75rem)]",
          )}
        >
          <span className="flex min-w-0 items-center gap-3">
            <IconComponent className={iconClassName} />
            <span className="truncate">{item.label}</span>
          </span>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 transition-transform", !isOpen && "-rotate-90")}
          />
        </button>
        {isOpen && (
          <div className="mt-1 space-y-1 border-l border-slate-200 pl-2 dark:border-border">
            {item.children
              .slice()
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((child) => (
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
        "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
        isActive
          ? "border-l-2 border-blue-600 bg-blue-50 text-blue-700 dark:border-primary dark:bg-primary/15 dark:text-primary"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground",
        level > 0 && "ml-3 h-9 w-[calc(100%-0.75rem)] text-xs",
      )}
    >
      <IconComponent className={iconClassName} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

interface AdminSidebarProps {
  adminMenuItems: MenuItem[];
  isLoading?: boolean;
}

function buildAdminTree(items: MenuItem[]) {
  const adminItems = items.filter(
    (item) => item.code.startsWith("admin-") || item.path.startsWith("/admin"),
  );
  const sourceItems = adminItems.length > 0 ? adminItems : fallbackItems;
  const itemById = new Map<string, MenuItem>();

  sourceItems.forEach((item) => {
    itemById.set(item.id, { ...item, children: [...(item.children || [])] });
  });

  itemById.forEach((item) => {
    item.children.forEach((child) => {
      if (!itemById.has(child.id)) {
        itemById.set(child.id, { ...child, children: [...(child.children || [])] });
      }
    });
  });

  if (![...itemById.values()].some((item) => item.path === "/admin/roles")) {
    const adminRoot = itemById.get("admin-dashboard-fallback")
      ? "admin-dashboard-fallback"
      : [...itemById.values()].find((item) => item.code === "admin-dashboard")?.id;

    itemById.set("admin-roles-synthetic", {
      id: "admin-roles-synthetic",
      code: "admin-roles",
      label: "Roles & Permissions",
      path: "/admin/roles",
      icon: "KeyRound",
      parentId: adminRoot || null,
      orderIndex: 108,
      isActive: true,
      roles: [],
      createdAt: "",
      updatedAt: "",
      children: [],
    });
  }

  const roots: MenuItem[] = [];

  itemById.forEach((item) => {
    const parent = item.parentId ? itemById.get(item.parentId) : null;

    if (parent) {
      const alreadyLinked = parent.children.some((child) => child.id === item.id);
      if (!alreadyLinked) {
        parent.children = [...parent.children, item].sort(
          (a, b) => a.orderIndex - b.orderIndex,
        );
      }
      return;
    }

    roots.push(item);
  });

  return roots.sort((a, b) => a.orderIndex - b.orderIndex);
}

export function AdminSidebar({
  adminMenuItems,
  isLoading = false,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const adminItems = buildAdminTree(adminMenuItems);
  const isQueueActive =
    pathname === "/admin/queues" || pathname.startsWith("/admin/queues/");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const value = localStorage.getItem("elp_sidebar_collapsed");
      if (value !== null) setCollapsed(value === "1");
    } catch {
      // ignore
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("elp_sidebar_collapsed", next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <aside className={cn("hidden shrink-0 border-r border-slate-200 bg-white transition-[width] duration-300 ease-out lg:block dark:border-border dark:bg-card overflow-hidden", collapsed ? "w-20" : "w-[204px]")}>
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </aside>
    );
  }

  return (
    <aside className={cn("hidden shrink-0 border-r border-slate-200 bg-white shadow-sm transition-[width] duration-300 ease-out lg:block dark:border-border dark:bg-card overflow-hidden", collapsed ? "w-20" : "w-[204px]")}>
      <div className="sticky top-0 flex h-screen flex-col">
        <div className={cn("flex h-[50px] items-center border-b border-slate-100 px-4 dark:border-border", collapsed ? "justify-center" : "justify-center") }>
          <Link href="/admin" className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-full border border-blue-100 bg-white shadow-sm shrink-0">
              <div className="h-7 w-7 rounded-full bg-[conic-gradient(from_20deg,#facc15_0_28%,#2563eb_0_58%,#38bdf8_0_76%,#facc15_0)]" />
            </div>
            <div className={cn("leading-tight transition-all duration-300 ease-out overflow-hidden", collapsed ? "max-w-0 opacity-0 -translate-x-2 scale-95" : "max-w-[7rem] opacity-100 translate-x-0 scale-100") } aria-hidden={collapsed}>
              <p className="text-sm font-bold tracking-[0.08em] text-slate-800 dark:text-foreground">
                ENGLISH
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600">
                Admin
              </p>
            </div>
          </Link>
        </div>

        <button
          type="button"
          onClick={toggleCollapsed}
          className="z-40 absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm dark:border-border dark:bg-card"
          aria-label="Thu gọn menu"
        >
          <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform duration-300", collapsed && "rotate-180")} />
        </button>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {adminItems.map((item) => (
            <AdminMenuItem key={item.id} item={item} collapsed={collapsed} />
          ))}

          <div className="my-3 border-t border-slate-100 pt-3 dark:border-border">
            <Link
              href="/admin/queues"
              className={cn(
                "flex h-10 items-center rounded-md px-3 text-sm font-medium transition-colors",
                isQueueActive
                  ? "border-l-2 border-blue-600 bg-blue-50 text-blue-700 dark:border-primary dark:bg-primary/15 dark:text-primary"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground",
                collapsed ? "justify-center px-2" : "gap-3",
              )}
              title="Queue Monitor"
            >
              <Zap className="h-4 w-4 shrink-0" />
              <span className={cn("truncate transition-all duration-300 ease-out", collapsed ? "max-w-0 opacity-0 -translate-x-2 scale-95" : "max-w-[10rem] opacity-100 translate-x-0 scale-100") } aria-hidden={collapsed}>
                Queue Monitor
              </span>
            </Link>
          </div>
        </nav>
      </div>
    </aside>
  );
}
