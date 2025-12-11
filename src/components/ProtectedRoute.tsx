"use client";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { isAdminEmail } from "@/lib/adminAllowlist";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (loading) return;
    const ok = isAdminEmail(user?.email || undefined);
    if (!ok) router.replace("/login");
  }, [user, loading, router, mounted]);

  if (!mounted || loading) {
    return (
      <div className="min-h-[50vh] grid place-items-center text-sm text-[var(--color-brown)]/70">
        Yükleniyor...
      </div>
    );
  }

  if (!user || !isAdminEmail(user.email)) return null;
  return <>{children}</>;
}
