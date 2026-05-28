import { create } from "zustand";
import { MenuItem, menuApi } from "@/features/menu/api/menu.api";

interface MenuState {
  menuItems: MenuItem[];
  isLoading: boolean;
  hasLoaded: boolean;
  error: string | null;
  fetchMenuForUser: (options?: { force?: boolean }) => Promise<void>;
  setMenuItems: (items: MenuItem[]) => void;
  clearMenu: () => void;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  menuItems: [],
  isLoading: false,
  hasLoaded: false,
  error: null,

  fetchMenuForUser: async (options) => {
    const { isLoading, hasLoaded } = get();

    if (isLoading || (hasLoaded && !options?.force)) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await menuApi.getMenuForUser();
      set({ menuItems: response.data, isLoading: false, hasLoaded: true });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch menu",
        isLoading: false,
        hasLoaded: true,
      });
    }
  },

  setMenuItems: (items) => set({ menuItems: items, hasLoaded: true }),

  clearMenu: () =>
    set({ menuItems: [], hasLoaded: false, error: null, isLoading: false }),
}));
