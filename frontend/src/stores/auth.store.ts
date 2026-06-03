import { create } from 'zustand';

export interface SafeUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  level: number;
  xp: number;
  streakDays: number;
  status: string;
  roleCodes?: string[];
}

interface AuthState {
  user: SafeUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authReady: boolean;
  setUser: (user: SafeUser | null) => void;
  setIsLoading: (loading: boolean) => void;
  setAuthReady: (ready: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  authReady: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  setAuthReady: (ready) => set({ authReady: ready }),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      authReady: true,
    }),
}));
