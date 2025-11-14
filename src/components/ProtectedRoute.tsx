"use client";
import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { isAdminEmail } from "@/lib/adminAllowlist";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);

  useEffect(() => {
    if (loading) return;
    const ok = isAdminEmail(user?.email || undefined);
    if (!ok) router.replace("/login");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-[50vh] grid place-items-center text-sm text-[var(--color-brown)]/70">
        Yükleniyor...
      </div>
    );
  }

  if (!user || !isAdminEmail(user.email)) return null;
  return <>{children}</>;
}
