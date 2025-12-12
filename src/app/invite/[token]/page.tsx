"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = (params?.token as string) || "";

  useEffect(() => {
    if (!token) {
      router.replace("/");
      return;
    }
    router.replace(`/login?inviteToken=${encodeURIComponent(token)}`);
  }, [token, router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white/95 p-6 shadow-sm text-sm text-[var(--color-brown)]/80">
        <p>Davet bağlantısı doğrulanıyor, giriş sayfasına yönlendiriliyorsun...</p>
      </div>
    </div>
  );
}
