import { api, ApiResponse } from "@/services/api";

export interface Permission {
  id: string;
  code: string;
  description?: string | null;
  resource: string;
  action: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RolePermission {
  id?: string;
  roleId?: string;
  permissionId: string;
  permission: Permission;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  rolePermissions: RolePermission[];
}

export interface CreateRolePayload {
  name: string;
  code: string;
  description?: string;
}

export interface CreatePermissionPayload {
  code: string;
  resource: string;
  action: string;
  description?: string;
}

export const accessControlApi = {
  getRoles: async (): Promise<ApiResponse<Role[]>> => {
    const response = await api.get<ApiResponse<Role[]>>("/roles");
    return response.data;
  },

  createRole: async (data: CreateRolePayload): Promise<ApiResponse<Role>> => {
    const response = await api.post<ApiResponse<Role>>("/roles", data);
    return response.data;
  },

  getPermissions: async (): Promise<ApiResponse<Permission[]>> => {
    const response = await api.get<ApiResponse<Permission[]>>("/permissions");
    return response.data;
  },

  createPermission: async (
    data: CreatePermissionPayload,
  ): Promise<ApiResponse<Permission>> => {
    const response = await api.post<ApiResponse<Permission>>(
      "/permissions",
      data,
    );
    return response.data;
  },

  addPermissionToRole: async (
    roleId: string,
    permissionId: string,
  ): Promise<ApiResponse<RolePermission>> => {
    const response = await api.post<ApiResponse<RolePermission>>(
      `/roles/${roleId}/permissions/${permissionId}`,
    );
    return response.data;
  },

  removePermissionFromRole: async (
    roleId: string,
    permissionId: string,
  ): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(
      `/roles/${roleId}/permissions/${permissionId}`,
    );
    return response.data;
  },
};
