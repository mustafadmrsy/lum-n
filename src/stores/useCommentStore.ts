import { create } from "zustand";
import { Comment } from "@/types/models";
import { api } from "@/services/api";

interface CommentState {
  comments: Comment[];
  pendingComments: Comment[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchComments: (blogId: string) => Promise<void>;
  fetchPendingComments: () => Promise<void>;
  createComment: (comment: {
    blogId: string;
    userId: string;
    userName: string;
    userPhoto?: string;
    content: string;
    parentId?: string;
  }) => Promise<void>;
  approveComment: (id: string, blogId: string) => Promise<void>;
  clearComments: () => void;
  clearError: () => void;
}

export const useCommentStore = create<CommentState>((set, get) => ({
  comments: [],
  pendingComments: [],
  isLoading: false,
  error: null,

  fetchComments: async (blogId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.comment.getByBlog(blogId);
      if (result.success && result.data) {
        set({ comments: result.data, isLoading: false });
      } else {
        set({ error: result.error || "Failed to fetch comments", isLoading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  fetchPendingComments: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.comment.getPending();
      if (result.success && result.data) {
        set({ pendingComments: result.data, isLoading: false });
      } else {
        set({ error: result.error || "Failed to fetch pending comments", isLoading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  createComment: async (comment) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.comment.create(comment);
      if (result.success) {
        // Refetch comments to get the updated list
        await get().fetchComments(comment.blogId);
      } else {
        set({ error: result.error || "Failed to create comment", isLoading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  approveComment: async (id, blogId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.comment.approve(id, blogId);
      if (result.success) {
        // Remove from pending comments
        const { pendingComments } = get();
        set({
          pendingComments: pendingComments.filter((c) => c.id !== id),
          isLoading: false,
        });
      } else {
        set({ error: result.error || "Failed to approve comment", isLoading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  clearComments: () => set({ comments: [], pendingComments: [] }),
  clearError: () => set({ error: null }),
}));
