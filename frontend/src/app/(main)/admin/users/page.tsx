"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  AlertTriangle,
  Download,
  Edit3,
  Filter,
  RefreshCw,
  Search,
  Shield,
  SlidersHorizontal,
  Trash2,
  Upload,
  UserPlus,
} from "lucide-react";
import {
  useActivateUser,
  useAdminUsers,
  useAssignRole,
  useDeleteUser,
  useRemoveRole,
  useSuspendUser,
  UserWithStats,
} from "@/features/admin/hooks/use-admin.hook";
import { useQuery } from "@tanstack/react-query";
import { menuApi } from "@/features/menu/api/menu.api";
import { cn } from "@/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

const statusLabels: Record<string, string> = {
  ACTIVE: "Kích hoạt",
  SUSPENDED: "Tạm khóa",
  INACTIVE: "Chưa kích hoạt",
};

const roleLabels: Record<string, string> = {
  super_admin: "Tổng giám đốc",
  admin: "Quản trị viên",
  teacher: "Giáo viên",
  student: "Học viên",
  user: "Học viên",
};

const pageSizeOptions = [1, 10, 20, 50, 100, 200];

type PaginationItem = number | "ellipsis";

function getPaginationItems(
  currentPage: number,
  totalPages: number,
): PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis",
    currentPage - 2,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    currentPage + 2,
    "ellipsis",
    totalPages,
  ];
}

function formatDate(value?: string) {
  if (!value) return "---";
  return new Intl.DateTimeFormat("vi-VN").format(new Date(value));
}

function employeeCode(user: UserWithStats, index: number) {
  const suffix = user.id
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-3)
    .toUpperCase();
  return `EL-${suffix || String(index + 1).padStart(3, "0")}`;
}

function primaryRole(user: UserWithStats) {
  const role = user.roleCodes?.[0] || "user";
  return roleLabels[role] || role.replace(/_/g, " ");
}

function TruncatedText({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <TooltipPrimitive.Provider delayDuration={250}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <span className={cn("block min-w-0 truncate", className)}>
            {children}
          </span>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side="top"
            align="center"
            sideOffset={8}
            className="z-[100] max-w-[360px] rounded-md bg-neutral-900 px-3 py-2 text-xs font-medium leading-5 text-white shadow-lg"
          >
            {children}
            <TooltipPrimitive.Arrow className="fill-neutral-900" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    | {
        type: "remove-role";
        userId: string;
        userName: string;
        roleCode: string;
      }
    | {
        type: "suspend";
        userId: string;
        userName: string;
      }
    | null
  >(null);

  const {
    data: usersData,
    isLoading,
    refetch,
    isFetching,
  } = useAdminUsers({
    page,
    limit,
    search: search || undefined,
    status: status || undefined,
  });
  const suspendUser = useSuspendUser();
  const activateUser = useActivateUser();
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();
  const deleteUser = useDeleteUser();
  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: menuApi.getAllRoles,
  });

  const users = usersData?.data || [];
  const meta = usersData?.meta;
  const assignableRoles = rolesData?.data || [];
  const isConfirmPending = removeRole.isPending || suspendUser.isPending;
  const pages = useMemo(() => {
    return getPaginationItems(page, meta?.totalPages || 1);
  }, [meta?.totalPages, page]);

  const handleRoleSelect = (user: UserWithStats, roleCode: string) => {
    if (user.roleCodes?.includes(roleCode)) {
      setConfirmAction({
        type: "remove-role",
        userId: user.id,
        userName: user.fullName,
        roleCode,
      });
      return;
    }

    assignRole.mutate({ userId: user.id, roleCode });
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;

    if (confirmAction.type === "remove-role") {
      removeRole.mutate(
        { userId: confirmAction.userId, roleCode: confirmAction.roleCode },
        { onSettled: () => setConfirmAction(null) },
      );
      return;
    }

    suspendUser.mutate(confirmAction.userId, {
      onSettled: () => setConfirmAction(null),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-110px)] min-h-[640px] flex-col">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-slate-950 dark:text-foreground">
            Quản lý nhân viên
          </h1>
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-700 dark:text-muted-foreground">
            <Filter className="h-5 w-5" />
            <span>Bộ lọc</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-end">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:w-[500px]">
            {/* <Select value="all">
              <SelectTrigger className="h-9 rounded border-slate-200 bg-white text-xs text-slate-500 shadow-none dark:border-border dark:bg-background">
                <SelectValue placeholder="Phòng ban" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả phòng ban</SelectItem>
                <SelectItem value="training">Đào tạo</SelectItem>
                <SelectItem value="operation">Vận hành</SelectItem>
              </SelectContent>
            </Select> */}
            <SearchableSelect
              value="all"
              onValueChange={() => {}}
              placeholder="Chọn chức danh"
              className="h-9 rounded border-slate-200 bg-white text-xs text-slate-500 shadow-none dark:border-border dark:bg-background"
              options={[
                { value: "all", label: "Tất cả chức danh" },
                { value: "admin", label: "Quản trị viên" },
                { value: "teacher", label: "Giáo viên" },
              ]}
            />
            <SearchableSelect
              value={status || "ALL"}
              onValueChange={(value) => {
                setPage(1);
                setStatus(value === "ALL" ? "" : value);
              }}
              placeholder="Loại hình làm việc"
              className="h-9 rounded border-slate-200 bg-white text-xs text-slate-500 shadow-none dark:border-border dark:bg-background"
              options={[
                { value: "ALL", label: "Tất cả trạng thái" },
                { value: "ACTIVE", label: "Đang làm việc" },
                { value: "SUSPENDED", label: "Đã nghỉ việc" },
                { value: "INACTIVE", label: "Chưa kích hoạt" },
              ]}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full min-w-[190px] lg:w-[230px]">
              <Input
                value={search}
                onChange={(event) => {
                  setPage(1);
                  setSearch(event.target.value);
                }}
                className="h-9 rounded border-slate-200 bg-white pr-9 text-xs shadow-none dark:border-border dark:bg-background"
                placeholder="Tìm theo từ khóa..."
              />
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
            <Button
              className="h-9 w-9 rounded bg-blue-700 p-0 hover:bg-blue-800"
              aria-label="Tìm kiếm"
              onClick={() => refetch()}
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-9 w-9 rounded border-slate-200 bg-white p-0 dark:border-border dark:bg-background"
              aria-label="Làm mới"
              onClick={() => refetch()}
            >
              <RefreshCw
                className={cn("h-4 w-4", isFetching && "animate-spin")}
              />
            </Button>
            {/* <Button
              variant="outline"
              className="h-9 gap-2 rounded border-slate-200 bg-white px-3 text-xs dark:border-border dark:bg-background"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Nâng cao
            </Button> */}
          </div>
        </div>
      </div>

      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => {
              setPage(1);
              setStatus("");
            }}
            className={cn(
              "h-9 border border-b-0 px-4 text-xs font-medium",
              status === ""
                ? "border-slate-200 bg-white text-blue-700 dark:border-border dark:bg-background"
                : "border-transparent bg-slate-100 text-slate-600 dark:bg-muted",
            )}
          >
            Danh sách
          </button>
          <button
            type="button"
            onClick={() => {
              setPage(1);
              setStatus("SUSPENDED");
            }}
            className={cn(
              "h-9 border border-b-0 px-4 text-xs font-medium",
              status === "SUSPENDED"
                ? "border-slate-200 bg-white text-blue-700 dark:border-border dark:bg-background"
                : "border-transparent bg-slate-100 text-slate-600 dark:bg-muted",
            )}
          >
            Đã khóa
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-9 gap-2 rounded border-slate-200 bg-white px-3 text-xs dark:border-border dark:bg-background"
          >
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button
            variant="outline"
            className="h-9 gap-2 rounded border-slate-200 bg-white px-3 text-xs dark:border-border dark:bg-background"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="h-9 gap-2 rounded bg-blue-700 px-3 text-xs hover:bg-blue-800">
            <UserPlus className="h-4 w-4" />
            Thêm mới
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden border border-slate-200 bg-white dark:border-border dark:bg-card">
        <div className="h-full overflow-auto">
          <table className="min-w-[1200px] w-full table-fixed border-collapse text-xs">
            <colgroup>
              <col className="w-[100px]" />
              <col className="w-[190px]" />
              <col className="w-[230px]" />
              <col className="w-[170px]" />
              <col className="w-[130px]" />
              <col className="w-[170px]" />
              <col className="w-[104px]" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-slate-50 text-slate-700 dark:bg-muted dark:text-muted-foreground">
              <tr>
                {[
                  "Mã NV",
                  "Họ tên",
                  // "Số điện thoại",
                  "Email",
                  // "Tình trạng làm việc",
                  "Trạng thái tài khoản",
                  // "CMND/CCCD",
                  // "Giới tính",
                  "Ngày tạo",
                  // "Địa chỉ",
                  // "Phòng ban",
                  "Chức danh",
                  "Thao tác",
                ].map((heading) => (
                  <th
                    key={heading}
                    className={cn(
                      "h-8 whitespace-nowrap border-b border-r border-slate-200 px-3 text-left font-medium last:border-r-0 dark:border-border",
                      heading === "Mã NV" &&
                        "sticky left-0 z-30 bg-slate-50 dark:bg-muted",
                    )}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr
                  key={user.id}
                  className="h-8 border-b border-slate-100 hover:bg-blue-50/40 dark:border-border dark:hover:bg-muted/40"
                >
                  <td className="sticky left-0 z-10 max-w-0 whitespace-nowrap border-r border-slate-100 bg-white px-2 text-blue-700 dark:border-border dark:bg-card dark:text-primary">
                    <button
                      type="button"
                      className="block max-w-full truncate underline-offset-2 hover:underline"
                      onClick={() => setSelectedUser(user)}
                    >
                      {employeeCode(user, index)}
                    </button>
                  </td>
                  <td className="max-w-0 border-r border-slate-100 px-2 font-medium dark:border-border">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                        {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                      <TruncatedText>{user.fullName || "---"}</TruncatedText>
                    </div>
                  </td>
                  {/* <td className="whitespace-nowrap border-r border-slate-100 px-3 dark:border-border">
                    {(user as any).phone || "---"}
                  </td> */}
                  <td className="max-w-0 border-r border-slate-100 px-2 dark:border-border">
                    <TruncatedText>{user.email || "---"}</TruncatedText>
                  </td>
                  {/* <td className="border-r border-slate-100 px-3 dark:border-border">
                    <Select
                      value={user.status === "SUSPENDED" ? "left" : "working"}
                      onValueChange={(value) => {
                        if (value === "left" && user.status === "ACTIVE") {
                          setConfirmAction({
                            type: "suspend",
                            userId: user.id,
                            userName: user.fullName,
                          });
                        }
                        if (value === "working" && user.status !== "ACTIVE") {
                          activateUser.mutate(user.id);
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 w-[130px] rounded border-slate-200 bg-white text-xs shadow-none dark:border-border dark:bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="working">Đang làm việc</SelectItem>
                        <SelectItem value="left">Đã nghỉ việc</SelectItem>
                      </SelectContent>
                    </Select>
                  </td> */}
                  <td className="max-w-0 border-r border-slate-100 px-2 dark:border-border">
                    <button
                      type="button"
                      onClick={() =>
                        user.status === "ACTIVE"
                          ? setConfirmAction({
                              type: "suspend",
                              userId: user.id,
                              userName: user.fullName,
                            })
                          : activateUser.mutate(user.id)
                      }
                      className={cn(
                        "inline-flex h-5 items-center gap-1 rounded-full px-2 text-[11px] font-semibold text-white",
                        user.status === "ACTIVE"
                          ? "bg-blue-600"
                          : "bg-slate-500",
                      )}
                    >
                      {statusLabels[user.status] || user.status}
                      <span className="h-2.5 w-2.5 rounded-full bg-white/90" />
                    </button>
                  </td>
                  {/* <td className="whitespace-nowrap border-r border-slate-100 px-3 dark:border-border">
                    {user.id.replace(/-/g, "").slice(0, 12)}
                  </td> */}
                  {/* <td className="whitespace-nowrap border-r border-slate-100 px-3 dark:border-border">
                    {(user as any).gender || "---"}
                  </td> */}
                  <td className="max-w-0 whitespace-nowrap border-r border-slate-100 px-3 dark:border-border">
                    {formatDate(user.createdAt)}
                  </td>
                  {/* <td className="max-w-[160px] border-r border-slate-100 px-3 dark:border-border">
                    <span className="line-clamp-1">
                      {(user as any).address || "---"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap border-r border-slate-100 px-3 dark:border-border">
                    {(user as any).department || "---"}
                  </td> */}
                  <td className="max-w-0 border-r border-slate-100 px-2 dark:border-border">
                    <SearchableSelect
                      value=""
                      onValueChange={(roleCode) => handleRoleSelect(user, roleCode)}
                      disabled={
                        assignRole.isPending ||
                        removeRole.isPending ||
                        rolesLoading
                      }
                      selectedLabel={
                        user.roleCodes?.length
                          ? user.roleCodes
                              .map((r) => roleLabels[r] || r.replace(/_/g, " "))
                              .join(", ")
                          : primaryRole(user)
                      }
                      className="h-8 w-full rounded border-slate-200 bg-white text-xs shadow-none dark:border-border dark:bg-background"
                      options={assignableRoles.map((role) => ({
                        value: role.code,
                        label: role.name,
                        searchText: role.code,
                      }))}
                      renderOption={(option) => (
                        <span className="flex w-full items-center justify-between gap-3">
                          <span>{option.label}</span>
                          {user.roleCodes?.includes(option.value) && (
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          )}
                        </span>
                      )}
                    />
                  </td>
                  <td className="max-w-0 whitespace-nowrap px-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="h-5 w-7 rounded border-slate-200 bg-slate-50 p-0 dark:border-border dark:bg-background"
                        aria-label="Sửa"
                      >
                        <Edit3
                          aria-hidden="true"
                          className="block h-3.5 w-3.5 shrink-0 text-slate-700 dark:text-slate-200"
                          strokeWidth={2.25}
                        />
                      </Button>
                      <Button
                        variant="outline"
                        className="h-5 w-7 rounded border-slate-200 bg-slate-50 p-0 text-red-600 dark:border-border dark:bg-background"
                        onClick={() => {
                          if (confirm(`Xóa người dùng "${user.fullName}"?`)) {
                            deleteUser.mutate(user.id);
                          }
                        }}
                        aria-label="Xóa"
                      >
                        <Trash2
                          aria-hidden="true"
                          className="block h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400"
                          strokeWidth={2.25}
                        />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="h-48 text-center text-sm text-slate-500"
                  >
                    Không tìm thấy nhân viên phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-3 py-4 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between dark:text-muted-foreground">
        <span>Tổng số lượng: {meta?.total || 0}</span>
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            className="h-8 w-8 rounded border-0 bg-transparent p-0 text-slate-900 shadow-none hover:bg-slate-100 hover:text-slate-950 disabled:bg-transparent disabled:text-slate-300 dark:text-slate-100 dark:hover:bg-muted dark:hover:text-white dark:disabled:text-slate-600"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1}
            aria-label="Trang trước"
          >
            <span aria-hidden="true" className="text-lg font-bold leading-none">
              ‹
            </span>
          </Button>
          {pages.map((item, index) =>
            item === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                className="flex h-8 min-w-8 items-center justify-center text-xs text-slate-400"
              >
                ...
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => setPage(item)}
                className={cn(
                  "h-8 min-w-8 rounded border px-2 text-xs",
                  page === item
                    ? "border-blue-600 bg-white text-blue-700 dark:bg-background"
                    : "border-transparent text-slate-600",
                )}
              >
                {item}
              </button>
            ),
          )}
          <Button
            variant="ghost"
            className="h-8 w-8 rounded border-0 bg-transparent p-0 text-slate-900 shadow-none hover:bg-slate-100 hover:text-slate-950 disabled:bg-transparent disabled:text-slate-300 dark:text-slate-100 dark:hover:bg-muted dark:hover:text-white dark:disabled:text-slate-600"
            onClick={() =>
              setPage((current) => Math.min(meta?.totalPages || 1, current + 1))
            }
            disabled={page >= (meta?.totalPages || 1)}
            aria-label="Trang sau"
          >
            <span aria-hidden="true" className="text-lg font-bold leading-none">
              ›
            </span>
          </Button>
          <SearchableSelect
            value={String(limit)}
            onValueChange={(value) => {
              setPage(1);
              setLimit(Number(value));
            }}
            className="h-8 w-[118px] rounded border-slate-200 bg-white text-xs shadow-none dark:border-border dark:bg-background"
            options={pageSizeOptions.map((option) => ({
              value: String(option),
              label: `${option} / trang`,
            }))}
          />
        </div>
      </div>

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4">
          <div className="w-full max-w-xs rounded-md border bg-popover p-3 text-popover-foreground shadow-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {confirmAction.type === "remove-role"
                    ? "Gỡ quyền này?"
                    : "Tạm khóa người dùng?"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {confirmAction.type === "remove-role"
                    ? `${confirmAction.userName} sẽ mất quyền "${confirmAction.roleCode}".`
                    : `${confirmAction.userName} sẽ mất quyền truy cập cho đến khi kích hoạt lại.`}
                </p>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmAction(null)}
                disabled={isConfirmPending}
                className="h-8 px-3"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleConfirmAction}
                disabled={isConfirmPending}
                className="h-8 px-3"
              >
                {isConfirmPending ? "Đang lưu..." : "Xác nhận"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      >
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.fullName || "Chi tiết nhân viên"}
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-3 py-2 sm:grid-cols-2">
              {[
                ["Mã", employeeCode(selectedUser, 0)],
                ["ID", selectedUser.id],
                ["Email", selectedUser.email],
                ["Họ tên", selectedUser.fullName],
                ["Avatar", selectedUser.avatarUrl || "---"],
                ["Cấp độ", selectedUser.level],
                ["XP", selectedUser.xp],
                ["Chuỗi ngày", selectedUser.streakDays],
                [
                  "Trạng thái",
                  statusLabels[selectedUser.status] || selectedUser.status,
                ],
                [
                  "Quyền",
                  selectedUser.roleCodes
                    ?.map((r) => roleLabels[r] || r)
                    .join(", ") || "---",
                ],
                [
                  "Ngày tạo",
                  new Date(selectedUser.createdAt).toLocaleString("vi-VN"),
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-md border border-slate-200 p-3 dark:border-border"
                >
                  <p className="text-xs font-medium uppercase text-slate-500">
                    {label}
                  </p>
                  <p className="mt-1 break-words text-sm">{value}</p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
