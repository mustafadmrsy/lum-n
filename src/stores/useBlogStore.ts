import { create } from "zustand";
import { BlogPost, BlogStatus } from "@/types/models";
import { api } from "@/services/api";

interface BlogState {
  blogs: BlogPost[];
  currentBlog: BlogPost | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchBlogs: (params?: {
    pageSize?: number;
    category?: string;
    tag?: string;
    search?: string;
  }) => Promise<void>;
  fetchBlogById: (id: string) => Promise<void>;
  fetchBlogBySlug: (slug: string) => Promise<void>;
  createBlog: (blog: {
    title: string;
    content: string;
    excerpt: string;
    authorId: string;
    authorName: string;
    tags?: string[];
    categories?: string[];
  }) => Promise<{ id: string; slug: string } | null>;
  updateBlog: (id: string, updates: Partial<BlogPost>) => Promise<void>;
  deleteBlog: (id: string) => Promise<void>;
  publishBlog: (id: string, publishedBy: string) => Promise<void>;
  addEditorNote: (
    blogId: string,
    note: {
      editorId: string;
      editorName: string;
      content: string;
      position: { start: number; end: number };
    }
  ) => Promise<void>;
  resolveEditorNote: (blogId: string, noteId: string) => Promise<void>;
  clearCurrentBlog: () => void;
  clearError: () => void;
}

export const useBlogStore = create<BlogState>((set, get) => ({
  blogs: [],
  currentBlog: null,
  isLoading: false,
  error: null,

  fetchBlogs: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.blog.getPublished(params);
      if (result.success && result.data) {
        set({ blogs: result.data, isLoading: false });
      } else {
        set({ error: result.error || "Failed to fetch blogs", isLoading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  fetchBlogById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.blog.getById(id);
      if (result.success && result.data) {
        set({ currentBlog: result.data, isLoading: false });
      } else {
        set({ error: result.error || "Failed to fetch blog", isLoading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  fetchBlogBySlug: async (slug) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.blog.getBySlug(slug);
      if (result.success && result.data) {
        set({ currentBlog: result.data, isLoading: false });
      } else {
        set({ error: result.error || "Failed to fetch blog", isLoading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  createBlog: async (blog) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.blog.create(blog);
      if (result.success && result.data) {
        set({ isLoading: false });
        return result.data;
      } else {
        set({ error: result.error || "Failed to create blog", isLoading: false });
        return null;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
      return null;
    }
  },

  updateBlog: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.blog.update(id, updates);
      if (result.success) {
        // Update current blog if it's the one being updated
        const { currentBlog } = get();
        if (currentBlog && currentBlog.id === id) {
          set({ currentBlog: { ...currentBlog, ...updates }, isLoading: false });
        } else {
          set({ isLoading: false });
        }
      } else {
        set({ error: result.error || "Failed to update blog", isLoading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  deleteBlog: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.blog.delete(id);
      if (result.success) {
        const { blogs } = get();
        set({
          blogs: blogs.filter((b) => b.id !== id),
          currentBlog: null,
          isLoading: false,
        });
      } else {
        set({ error: result.error || "Failed to delete blog", isLoading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  publishBlog: async (id, publishedBy) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.blog.publish(id, publishedBy);
      if (result.success) {
        const { currentBlog } = get();
        if (currentBlog && currentBlog.id === id) {
          set({
            currentBlog: { ...currentBlog, status: BlogStatus.PUBLISHED },
            isLoading: false,
          });
        } else {
          set({ isLoading: false });
        }
      } else {
        set({ error: result.error || "Failed to publish blog", isLoading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  addEditorNote: async (blogId, note) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.blog.addNote(blogId, note);
      if (result.success) {
        await get().fetchBlogById(blogId);
      } else {
        set({ error: result.error || "Failed to add note", isLoading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  resolveEditorNote: async (blogId, noteId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.blog.resolveNote(blogId, noteId);
      if (result.success) {
        await get().fetchBlogById(blogId);
      } else {
        set({ error: result.error || "Failed to resolve note", isLoading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  clearCurrentBlog: () => set({ currentBlog: null }),
  clearError: () => set({ error: null }),
}));
