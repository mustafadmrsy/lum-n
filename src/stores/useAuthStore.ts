import { create } from "zustand";
import { User } from "@/types/models";
import { api } from "@/services/api";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, displayName: string) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  setUser: (user) => set({ user }),

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.auth.login({ email, password });
      if (result.success && result.data) {
        set({
          user: result.data.user as unknown as User,
          isLoading: false,
          isInitialized: true,
        });
        return true;
      } else {
        set({ error: result.error || "Giriş başarısız", isLoading: false });
        return false;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Bir hata oluştu",
        isLoading: false,
      });
      return false;
    }
  },

  register: async (email, password, displayName) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.auth.register({ email, password, displayName });
      if (result.success && result.data) {
        set({
          user: result.data.user as unknown as User,
          isLoading: false,
          isInitialized: true,
        });
        return true;
      } else {
        set({ error: result.error || "Kayıt başarısız", isLoading: false });
        return false;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Bir hata oluştu",
        isLoading: false,
      });
      return false;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await api.auth.logout();
      set({ user: null, isLoading: false, isInitialized: true });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Çıkış yapılamadı",
        isLoading: false,
      });
    }
  },

  fetchCurrentUser: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.auth.me();
      if (result.success && result.data) {
        set({
          user: result.data.user as unknown as User,
          isLoading: false,
          isInitialized: true,
        });
      } else {
        set({ user: null, isLoading: false, isInitialized: true });
      }
    } catch (error) {
      set({ user: null, isLoading: false, isInitialized: true });
    }
  },

  clearUser: () => set({ user: null }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
