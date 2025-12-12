"use client";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";

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
    if (!user) {
      router.replace("/login");
    }
  }, [mounted, loading, user, router]);

  if (!mounted || loading) {
    return (
      <div className="min-h-[50vh] grid place-items-center text-sm text-[var(--color-brown)]/70">
        Yükleniyor...
      </div>
    );
  }

  if (!user) return null;
  return <>{children}</>;
}
