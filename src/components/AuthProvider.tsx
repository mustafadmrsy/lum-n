"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchCurrentUser, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) {
      fetchCurrentUser();
    }
  }, [fetchCurrentUser, isInitialized]);

  return <>{children}</>;
}
