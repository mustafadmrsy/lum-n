import { create } from "zustand";
import { BlogStats } from "@/types/models";
import { api } from "@/services/api";

interface StatsState {
  stats: Record<string, BlogStats>;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchStats: (blogId: string) => Promise<void>;
  recordView: (
    blogId: string,
    sessionId: string,
    userId?: string,
    userAgent?: string,
    referrer?: string
  ) => Promise<void>;
  toggleLike: (blogId: string, userId: string, isLiked: boolean, likeId?: string) => Promise<void>;
  recordShare: (
    blogId: string,
    platform: "twitter" | "facebook" | "linkedin" | "whatsapp" | "embed",
    userId?: string,
    referrer?: string
  ) => Promise<void>;
  clearStats: () => void;
  clearError: () => void;
}

export const useStatsStore = create<StatsState>((set, get) => ({
  stats: {},
  isLoading: false,
  error: null,

  fetchStats: async (blogId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.stats.get(blogId);
      if (result.success && result.data) {
        const { stats } = get();
        set({
          stats: { ...stats, [blogId]: result.data },
          isLoading: false,
        });
      } else {
        set({ error: result.error || "Failed to fetch stats", isLoading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  recordView: async (blogId, sessionId, userId, userAgent, referrer) => {
    try {
      await api.stats.recordView(blogId, sessionId, userId, userAgent, referrer);
      // Refetch stats to get updated count
      await get().fetchStats(blogId);
    } catch (error) {
      console.error("Failed to record view:", error);
    }
  },

  toggleLike: async (blogId, userId, isLiked, likeId) => {
    set({ isLoading: true, error: null });
    try {
      if (isLiked && likeId) {
        // Unlike
        const result = await api.stats.unlike(blogId, likeId);
        if (result.success) {
          await get().fetchStats(blogId);
        }
      } else {
        // Like
        const result = await api.stats.like(blogId, userId);
        if (result.success) {
          await get().fetchStats(blogId);
        }
      }
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  recordShare: async (blogId, platform, userId, referrer) => {
    try {
      await api.stats.share(blogId, platform, userId, referrer);
      // Refetch stats to get updated count
      await get().fetchStats(blogId);
    } catch (error) {
      console.error("Failed to record share:", error);
    }
  },

  clearStats: () => set({ stats: {} }),
  clearError: () => set({ error: null }),
}));
