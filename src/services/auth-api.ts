const API_BASE = "/api";

// Generic fetch wrapper
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

// Auth API Service
export const authApi = {
  // Register new user
  register: async (data: { email: string; password: string; displayName: string }) => {
    return fetchAPI<{ user: { id: string; email: string; displayName: string; role: string } }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },

  // Login
  login: async (data: { email: string; password: string }) => {
    return fetchAPI<{ user: { id: string; email: string; displayName: string; role: string; photoURL?: string } }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },

  // Logout
  logout: async () => {
    return fetchAPI("/auth/logout", {
      method: "POST",
    });
  },

  // Get current user
  me: async () => {
    return fetchAPI<{ user: { id: string; email: string; displayName: string; role: string; photoURL?: string; bio?: string } }>(
      "/auth/me"
    );
  },
};
