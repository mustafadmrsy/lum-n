import { BlogPost, BlogStatus, Comment, BlogStats, EditorNote } from "@/types/models";

const API_BASE = "/api";

// Generic fetch wrapper with error handling
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("API Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Blog API Service
export const blogApi = {
  // Get all published blogs
  getPublished: async (params?: {
    pageSize?: number;
    category?: string;
    tag?: string;
    search?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.pageSize) queryParams.set("pageSize", params.pageSize.toString());
    if (params?.category) queryParams.set("category", params.category);
    if (params?.tag) queryParams.set("tag", params.tag);
    if (params?.search) queryParams.set("search", params.search);

    const query = queryParams.toString();
    return fetchAPI<BlogPost[]>(`/blogs${query ? `?${query}` : ""}`);
  },

  // Get blog by ID
  getById: async (id: string) => {
    return fetchAPI<BlogPost>(`/blogs/${id}`);
  },

  // Get blog by slug
  getBySlug: async (slug: string) => {
    return fetchAPI<BlogPost>(`/blogs/slug/${slug}`);
  },

  // Create new blog
  create: async (blog: {
    title: string;
    content: string;
    excerpt: string;
    authorId: string;
    authorName: string;
    tags?: string[];
    categories?: string[];
    coverImage?: unknown;
    media?: unknown[];
  }) => {
    return fetchAPI<{ id: string; slug: string }>("/blogs", {
      method: "POST",
      body: JSON.stringify(blog),
    });
  },

  // Update blog
  update: async (id: string, updates: Partial<BlogPost>) => {
    return fetchAPI(`/blogs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  // Delete blog
  delete: async (id: string) => {
    return fetchAPI(`/blogs/${id}`, {
      method: "DELETE",
    });
  },

  // Publish blog
  publish: async (id: string, publishedBy: string) => {
    return fetchAPI(`/blogs/${id}/publish`, {
      method: "POST",
      body: JSON.stringify({ publishedBy }),
    });
  },

  // Add editor note
  addNote: async (
    blogId: string,
    note: {
      editorId: string;
      editorName: string;
      content: string;
      position: { start: number; end: number };
    }
  ) => {
    return fetchAPI(`/blogs/${blogId}/notes`, {
      method: "POST",
      body: JSON.stringify(note),
    });
  },

  // Resolve editor note
  resolveNote: async (blogId: string, noteId: string) => {
    return fetchAPI(`/blogs/${blogId}/notes`, {
      method: "PATCH",
      body: JSON.stringify({ noteId }),
    });
  },
};

// Comment API Service
export const commentApi = {
  // Get comments by blog ID
  getByBlog: async (blogId: string) => {
    return fetchAPI<Comment[]>(`/comments?blogId=${blogId}`);
  },

  // Get pending comments
  getPending: async () => {
    return fetchAPI<Comment[]>("/comments?pending=true");
  },

  // Create comment
  create: async (comment: {
    blogId: string;
    userId: string;
    userName: string;
    userPhoto?: string;
    content: string;
    parentId?: string;
  }) => {
    return fetchAPI<{ id: string }>("/comments", {
      method: "POST",
      body: JSON.stringify(comment),
    });
  },

  // Approve comment
  approve: async (id: string, blogId: string) => {
    return fetchAPI(`/comments/${id}/approve`, {
      method: "PATCH",
      body: JSON.stringify({ blogId }),
    });
  },
};

// Stats API Service
export const statsApi = {
  // Get stats for a blog
  get: async (blogId: string) => {
    return fetchAPI<BlogStats>(`/stats/${blogId}`);
  },

  // Record view
  recordView: async (
    blogId: string,
    sessionId: string,
    userId?: string,
    userAgent?: string,
    referrer?: string
  ) => {
    return fetchAPI(`/stats/${blogId}/view`, {
      method: "POST",
      body: JSON.stringify({ sessionId, userId, userAgent, referrer }),
    });
  },

  // Record like
  like: async (blogId: string, userId: string) => {
    return fetchAPI<{ id: string }>(`/stats/${blogId}/like`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  },

  // Remove like
  unlike: async (blogId: string, likeId: string) => {
    return fetchAPI(`/stats/${blogId}/like?likeId=${likeId}`, {
      method: "DELETE",
    });
  },

  // Record share
  share: async (
    blogId: string,
    platform: "twitter" | "facebook" | "linkedin" | "whatsapp" | "embed",
    userId?: string,
    referrer?: string
  ) => {
    return fetchAPI(`/stats/${blogId}/share`, {
      method: "POST",
      body: JSON.stringify({ platform, userId, referrer }),
    });
  },
};

// Media API Service
export const mediaApi = {
  // Upload file
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE}/media/upload`, {
      method: "POST",
      body: formData,
    });

    return response.json();
  },

  // Get presigned upload URL
  getPresignedUrl: async (filename: string, contentType: string, folder = "uploads") => {
    return fetchAPI<{ uploadUrl: string; key: string; cdnUrl: string }>(
      "/media/upload",
      {
        method: "PUT",
        body: JSON.stringify({ filename, contentType, folder }),
      }
    );
  },
};

// Auth API (import from separate file to avoid circular deps)
import { authApi } from "./auth-api";

// Export all services
export const api = {
  auth: authApi,
  blog: blogApi,
  comment: commentApi,
  stats: statsApi,
  media: mediaApi,
};
