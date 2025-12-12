"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import BookFlip from "@/components/BookFlip";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminDraftPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      setLoading(true);
      setData(null);
      const ref = doc(db, "dergi", id);
      const snap = await getDoc(ref);
      if (snap.exists()) setData({ id: snap.id, ...snap.data() });
      setLoading(false);
    };
    run();
  }, [id]);

  const pages: string[] = useMemo(() => {
    const raw: string = data?.content || "";
    let parts = raw
      .split(/<hr[^>]*class=["']page-break["'][^>]*\/?>(?:\n|\r)?/i)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) parts = [raw];
    return parts;
  }, [data?.content]);

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-6xl px-4 py-10">
        {loading && <div className="text-sm text-[var(--color-brown)]/70">Yükleniyor...</div>}
        {!loading && !data && <div className="text-sm text-[var(--color-brown)]/70">Dergi bulunamadı.</div>}

        {!loading && data && (
          <>
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-[var(--color-brown)]/60">Taslak Ön İzleme</div>
                <h1 className="font-serif text-3xl text-[var(--color-purple)]">{data.title || "Başlıksız"}</h1>
                <div className="mt-2 text-sm text-[var(--color-brown)]/70">
                  <span>Yazar: {data.authorName || "-"}</span>
                  <span> • Son düzenleyen: {data.lastEditedByName || data.authorName || "-"}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-full border border-black/10 px-4 py-2 text-sm"
                  onClick={() => router.push(`/admin/new?id=${id}`)}
                >
                  Düzenle
                </button>
                <button
                  type="button"
                  className="rounded-full px-4 py-2 text-sm btn-primary"
                  onClick={() => router.push("/admin")}
                >
                  Admin'e dön
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-[var(--color-brown)]/10 p-6">
              <BookFlip key={id} pages={pages} mode="alwaysFlip" />
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
