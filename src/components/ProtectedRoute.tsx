"use client";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { isAdminEmail } from "@/lib/adminAllowlist";

export default function ProtectedRoute({
  children,
  requireAdmin,
}: {
  children: ReactNode;
  requireAdmin?: boolean;
}) {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (requireAdmin && !isAdminEmail(user.email)) {
      router.replace("/");
    }
  }, [mounted, loading, user, router, requireAdmin]);

  if (!mounted || loading) {
    return (
      <div className="min-h-[50vh] grid place-items-center text-sm text-[var(--color-brown)]/70">
        Yükleniyor...
      </div>
    );
  }

  if (!user) return null;
  if (requireAdmin && !isAdminEmail(user.email)) return null;
  return <>{children}</>;
}
