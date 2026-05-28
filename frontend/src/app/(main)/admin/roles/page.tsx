"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  accessControlApi,
  Permission,
  Role,
} from "@/features/admin/api/access-control.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/utils";
import {
  Check,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Shield,
} from "lucide-react";

const emptyRoleForm = {
  name: "",
  code: "",
  description: "",
};

const emptyPermissionForm = {
  code: "",
  resource: "",
  action: "",
  description: "",
};

function normalizeCode(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function rolePermissionIds(role?: Role | null) {
  return new Set(
    role?.rolePermissions.map((item) => item.permissionId) || [],
  );
}

function groupPermissions(permissions: Permission[]) {
  return permissions.reduce<Record<string, Permission[]>>((groups, item) => {
    const key = item.resource || "other";
    groups[key] = [...(groups[key] || []), item];
    return groups;
  }, {});
}

export default function AdminRolesPage() {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [roleForm, setRoleForm] = useState(emptyRoleForm);
  const [permissionForm, setPermissionForm] = useState(emptyPermissionForm);

  const rolesQuery = useQuery({
    queryKey: ["admin", "access-control", "roles"],
    queryFn: accessControlApi.getRoles,
  });
  const permissionsQuery = useQuery({
    queryKey: ["admin", "access-control", "permissions"],
    queryFn: accessControlApi.getPermissions,
  });

  const roles = rolesQuery.data?.data || [];
  const permissions = permissionsQuery.data?.data || [];
  const selectedRole =
    roles.find((role) => role.id === selectedRoleId) || roles[0] || null;
  const assignedPermissionIds = rolePermissionIds(selectedRole);
  const filteredPermissions = permissions.filter((permission) =>
    `${permission.code} ${permission.resource} ${permission.action} ${permission.description || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const groupedPermissions = useMemo(
    () => groupPermissions(filteredPermissions),
    [filteredPermissions],
  );
  const permissionCount = selectedRole?.rolePermissions.length || 0;

  const refreshAccessControl = () => {
    queryClient.invalidateQueries({
      queryKey: ["admin", "access-control"],
    });
    queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
  };

  const createRole = useMutation({
    mutationFn: accessControlApi.createRole,
    onSuccess: (response) => {
      toast.success("Role created");
      setRoleForm(emptyRoleForm);
      setIsRoleDialogOpen(false);
      setSelectedRoleId(response.data.id);
      refreshAccessControl();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create role");
    },
  });

  const createPermission = useMutation({
    mutationFn: accessControlApi.createPermission,
    onSuccess: () => {
      toast.success("Permission created");
      setPermissionForm(emptyPermissionForm);
      setIsPermissionDialogOpen(false);
      refreshAccessControl();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create permission",
      );
    },
  });

  const togglePermission = useMutation({
    mutationFn: async ({
      roleId,
      permissionId,
      isAssigned,
    }: {
      roleId: string;
      permissionId: string;
      isAssigned: boolean;
    }) => {
      if (isAssigned) {
        await accessControlApi.removePermissionFromRole(roleId, permissionId);
        return;
      }

      await accessControlApi.addPermissionToRole(roleId, permissionId);
    },
    onSuccess: () => {
      refreshAccessControl();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update permission",
      );
    },
  });

  const handleCreateRole = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createRole.mutate({
      name: roleForm.name.trim(),
      code: normalizeCode(roleForm.code),
      description: roleForm.description.trim() || undefined,
    });
  };

  const handleCreatePermission = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createPermission.mutate({
      code: permissionForm.code.trim(),
      resource: permissionForm.resource.trim(),
      action: permissionForm.action.trim(),
      description: permissionForm.description.trim() || undefined,
    });
  };

  const isLoading = rolesQuery.isLoading || permissionsQuery.isLoading;
  const isRefreshing = rolesQuery.isFetching || permissionsQuery.isFetching;

  return (
    <div className="flex h-[calc(100vh-110px)] min-h-[640px] flex-col">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-slate-950 dark:text-foreground">
            Role & permission management
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Manage access roles and assign permissions by resource.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-9 w-full rounded border-slate-200 bg-white pr-9 text-xs shadow-none dark:border-border dark:bg-background sm:w-[280px]"
              placeholder="Search permissions..."
            />
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
          <Button
            variant="outline"
            className="h-9 w-9 rounded border-slate-200 bg-white p-0 dark:border-border dark:bg-background"
            aria-label="Refresh"
            onClick={() => refreshAccessControl()}
          >
            <RefreshCw
              className={cn("h-4 w-4", isRefreshing && "animate-spin")}
            />
          </Button>
          <Button
            variant="outline"
            className="h-9 gap-2 rounded border-slate-200 bg-white px-3 text-xs dark:border-border dark:bg-background"
            onClick={() => setIsPermissionDialogOpen(true)}
          >
            <KeyRound className="h-4 w-4" />
            New permission
          </Button>
          <Button
            className="h-9 gap-2 rounded bg-blue-700 px-3 text-xs hover:bg-blue-800"
            onClick={() => setIsRoleDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New role
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="min-h-0 overflow-hidden border border-slate-200 bg-white dark:border-border dark:bg-card">
          <div className="flex h-11 items-center justify-between border-b border-slate-200 px-3 dark:border-border">
            <span className="text-xs font-semibold text-slate-700 dark:text-muted-foreground">
              Roles
            </span>
            <span className="text-xs text-slate-500">{roles.length}</span>
          </div>
          <div className="h-full overflow-auto p-2">
            {isLoading &&
              Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="mb-2 h-16 w-full" />
              ))}

            {!isLoading &&
              roles.map((role) => {
                const isSelected = selectedRole?.id === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRoleId(role.id)}
                    className={cn(
                      "mb-2 flex w-full items-start gap-3 rounded-md border p-3 text-left transition",
                      isSelected
                        ? "border-blue-200 bg-blue-50 text-blue-800 dark:border-primary/40 dark:bg-primary/15 dark:text-primary"
                        : "border-slate-200 bg-white hover:bg-slate-50 dark:border-border dark:bg-background dark:hover:bg-muted",
                    )}
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-100 dark:bg-muted">
                      <Shield className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {role.name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">
                        {role.code}
                      </span>
                      <span className="mt-2 inline-flex h-6 items-center rounded-full bg-slate-100 px-2 text-[11px] font-medium text-slate-600 dark:bg-muted dark:text-muted-foreground">
                        {role.rolePermissions.length} permissions
                      </span>
                    </span>
                  </button>
                );
              })}
          </div>
        </aside>

        <section className="min-h-0 overflow-hidden border border-slate-200 bg-white dark:border-border dark:bg-card">
          <div className="flex h-14 items-center justify-between gap-3 border-b border-slate-200 px-4 dark:border-border">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold">
                {selectedRole?.name || "No role selected"}
              </h2>
              <p className="truncate text-xs text-slate-500">
                {selectedRole?.description || selectedRole?.code || "---"}
              </p>
            </div>
            <div className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-muted dark:text-muted-foreground">
              {permissionCount} / {permissions.length}
            </div>
          </div>

          <div className="h-full overflow-auto p-4">
            {isLoading &&
              Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="mb-3 h-12 w-full" />
              ))}

            {!isLoading &&
              Object.entries(groupedPermissions).map(([resource, items]) => (
                <div key={resource} className="mb-5">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase text-slate-500">
                      {resource}
                    </h3>
                    <span className="text-xs text-slate-400">
                      {items.length}
                    </span>
                  </div>
                  <div className="grid gap-2 xl:grid-cols-2">
                    {items.map((permission) => {
                      const isAssigned = assignedPermissionIds.has(
                        permission.id,
                      );
                      const isPending = togglePermission.isPending;
                      return (
                        <label
                          key={permission.id}
                          className={cn(
                            "flex min-w-0 items-start gap-3 rounded-md border p-3 text-sm transition",
                            selectedRole
                              ? "cursor-pointer"
                              : "cursor-not-allowed opacity-60",
                            isAssigned
                              ? "border-blue-200 bg-blue-50/80 dark:border-primary/40 dark:bg-primary/10"
                              : "border-slate-200 bg-white hover:bg-slate-50 dark:border-border dark:bg-background dark:hover:bg-muted",
                          )}
                        >
                          <span
                            className={cn(
                              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                              isAssigned
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-slate-300 bg-white dark:border-border dark:bg-card",
                            )}
                          >
                            {isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              isAssigned && <Check className="h-3.5 w-3.5" />
                            )}
                          </span>
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={isAssigned}
                            disabled={!selectedRole || isPending}
                            onChange={() => {
                              if (!selectedRole) return;
                              togglePermission.mutate({
                                roleId: selectedRole.id,
                                permissionId: permission.id,
                                isAssigned,
                              });
                            }}
                          />
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-slate-900 dark:text-foreground">
                              {permission.code}
                            </span>
                            <span className="mt-1 block text-xs text-slate-500">
                              {permission.description ||
                                `${permission.action} ${permission.resource}`}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}

            {!isLoading && filteredPermissions.length === 0 && (
              <div className="flex h-48 items-center justify-center text-sm text-slate-500">
                No permissions found
              </div>
            )}
          </div>
        </section>
      </div>

      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCreateRole}>
            <DialogHeader>
              <DialogTitle>Create role</DialogTitle>
              <DialogDescription>
                Add a role that can be assigned to users and menus.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="role-name">Name</Label>
                <Input
                  id="role-name"
                  value={roleForm.name}
                  onChange={(event) =>
                    setRoleForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role-code">Code</Label>
                <Input
                  id="role-code"
                  value={roleForm.code}
                  onChange={(event) =>
                    setRoleForm((current) => ({
                      ...current,
                      code: event.target.value,
                    }))
                  }
                  placeholder="content_manager"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role-description">Description</Label>
                <Input
                  id="role-description"
                  value={roleForm.description}
                  onChange={(event) =>
                    setRoleForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRoleDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createRole.isPending}>
                {createRole.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isPermissionDialogOpen}
        onOpenChange={setIsPermissionDialogOpen}
      >
        <DialogContent>
          <form onSubmit={handleCreatePermission}>
            <DialogHeader>
              <DialogTitle>Create permission</DialogTitle>
              <DialogDescription>
                Use the same code format as backend guards, for example
                lesson.create.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="permission-code">Code</Label>
                <Input
                  id="permission-code"
                  value={permissionForm.code}
                  onChange={(event) =>
                    setPermissionForm((current) => ({
                      ...current,
                      code: event.target.value,
                    }))
                  }
                  placeholder="lesson.create"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="permission-resource">Resource</Label>
                  <Input
                    id="permission-resource"
                    value={permissionForm.resource}
                    onChange={(event) =>
                      setPermissionForm((current) => ({
                        ...current,
                        resource: event.target.value,
                      }))
                    }
                    placeholder="lesson"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="permission-action">Action</Label>
                  <Input
                    id="permission-action"
                    value={permissionForm.action}
                    onChange={(event) =>
                      setPermissionForm((current) => ({
                        ...current,
                        action: event.target.value,
                      }))
                    }
                    placeholder="create"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="permission-description">Description</Label>
                <Input
                  id="permission-description"
                  value={permissionForm.description}
                  onChange={(event) =>
                    setPermissionForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPermissionDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createPermission.isPending}>
                {createPermission.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
