"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminUsers,
  useSuspendUser,
  useActivateUser,
  useAssignRole,
  UserWithStats,
} from "@/features/admin/hooks/use-admin.hook";
import {
  Search,
  UserPlus,
  Shield,
  ShieldOff,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");

  const { data: usersData, isLoading } = useAdminUsers({
    page,
    limit: 10,
    search: search || undefined,
    status: status || undefined,
  });

  const suspendUser = useSuspendUser();
  const activateUser = useActivateUser();
  const assignRole = useAssignRole();

  const handleSuspend = (userId: string) => {
    if (confirm("Are you sure you want to suspend this user?")) {
      suspendUser.mutate(userId);
    }
  };

  const handleActivate = (userId: string) => {
    activateUser.mutate(userId);
  };

  const handleAssignRole = (userId: string, roleCode: string) => {
    assignRole.mutate({ userId, roleCode });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage platform users and their roles
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({usersData?.meta?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {usersData?.data?.map((user: UserWithStats) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-lg font-bold text-primary">
                      {user.fullName?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{user.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={
                          user.status === "ACTIVE"
                            ? "default"
                            : user.status === "SUSPENDED"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {user.status}
                      </Badge>
                      {user.roleCodes?.map((code) => (
                        <Badge key={code} variant="outline">
                          {code}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAssignRole(user.id, "MODERATOR")}
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    Add Role
                  </Button>
                  {user.status === "ACTIVE" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuspend(user.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <ShieldOff className="h-4 w-4 mr-1" />
                      Suspend
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleActivate(user.id)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Activate
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {(!usersData?.data || usersData.data.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                No users found
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(usersData?.meta?.page ?? 1) * (usersData?.meta?.limit ?? 20) - (usersData?.meta?.limit ?? 20) + 1} - {Math.min((usersData?.meta?.page ?? 1) * (usersData?.meta?.limit ?? 20), usersData?.meta?.total ?? 0)} of {usersData?.meta?.total ?? 0} users (Page {page} of {usersData?.meta?.totalPages || 1})
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= (usersData?.meta?.totalPages || 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
