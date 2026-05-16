import { create } from 'zustand';
import { MenuItem, menuApi } from '@/features/menu/api/menu.api';

interface MenuState {
  menuItems: MenuItem[];
  isLoading: boolean;
  error: string | null;
  fetchMenuForUser: () => Promise<void>;
  setMenuItems: (items: MenuItem[]) => void;
  clearMenu: () => void;
}

export const useMenuStore = create<MenuState>((set) => ({
  menuItems: [],
  isLoading: false,
  error: null,

  fetchMenuForUser: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await menuApi.getMenuForUser();
      console.log('response', response);
      set({ menuItems: response.data, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch menu',
        isLoading: false,
      });
    }
  },

  setMenuItems: (items) => set({ menuItems: items }),

  clearMenu: () => set({ menuItems: [], error: null }),
}));
