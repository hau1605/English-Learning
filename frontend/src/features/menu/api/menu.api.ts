import { api, ApiResponse } from '@/services/api';

export interface MenuRole {
  id: string;
  code: string;
  name: string;
}

export interface MenuItem {
  id: string;
  code: string;
  label: string;
  icon: string | null;
  path: string;
  orderIndex: number;
  parentId: string | null;
  parent?: { id: string; code: string; label: string } | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  children: MenuItem[];
  roles: MenuRole[];
}

export interface CreateMenuItemDto {
  code: string;
  label: string;
  icon?: string;
  path: string;
  orderIndex?: number;
  parentId?: string;
  isActive?: boolean;
  roleCodes?: string[];
}

export interface UpdateMenuItemDto {
  code?: string;
  label?: string;
  icon?: string | null;
  path?: string;
  orderIndex?: number;
  parentId?: string | null;
  isActive?: boolean;
  roleCodes?: string[];
}

export interface ReorderMenuItemDto {
  id: string;
  orderIndex?: number;
  parentId?: string | null;
}

export const menuApi = {
  getMenuForUser: async (): Promise<ApiResponse<MenuItem[]>> => {
    const response = await api.get<ApiResponse<MenuItem[]>>('/menus/user');
    return response.data;
  },

  getAllMenus: async (includeInactive?: boolean): Promise<ApiResponse<MenuItem[]>> => {
    const response = await api.get<ApiResponse<MenuItem[]>>('/menus', {
      params: includeInactive ? { includeInactive } : undefined,
    });
    return response.data;
  },

  getMenuTree: async (): Promise<ApiResponse<MenuItem[]>> => {
    const response = await api.get<ApiResponse<MenuItem[]>>('/menus/tree');
    return response.data;
  },

  getMenuById: async (id: string): Promise<ApiResponse<MenuItem>> => {
    const response = await api.get<ApiResponse<MenuItem>>(`/menus/${id}`);
    return response.data;
  },

  getAllRoles: async (): Promise<ApiResponse<MenuRole[]>> => {
    const response = await api.get<ApiResponse<MenuRole[]>>('/menus/roles');
    return response.data;
  },

  createMenuItem: async (data: CreateMenuItemDto): Promise<ApiResponse<MenuItem>> => {
    const response = await api.post<ApiResponse<MenuItem>>('/menus', data);
    return response.data;
  },

  updateMenuItem: async (id: string, data: UpdateMenuItemDto): Promise<ApiResponse<MenuItem>> => {
    const response = await api.patch<ApiResponse<MenuItem>>(`/menus/${id}`, data);
    return response.data;
  },

  deleteMenuItem: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/menus/${id}`);
    return response.data;
  },

  reorderMenus: async (items: ReorderMenuItemDto[]): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>('/menus/reorder', items);
    return response.data;
  },
};
