"use client";
import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { UserRole } from "@/types/models";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole = UserRole.READER 
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isLoading, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized || isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    // Check role requirements
    const roleHierarchy = {
      [UserRole.READER]: 0,
      [UserRole.WRITER]: 1,
      [UserRole.EDITOR]: 2,
      [UserRole.ADMIN]: 3,
    };

    const userRoleLevel = roleHierarchy[user.role];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      router.replace("/");
    }
  }, [user, isLoading, isInitialized, router, requiredRole]);

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-[50vh] grid place-items-center text-sm text-[var(--color-brown)]/70">
        Yükleniyor...
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
