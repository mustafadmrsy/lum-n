"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import BookFlip from "@/components/BookFlip";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function MagazineDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const bookRef = useRef<any>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      const ref = doc(db, "dergi", id);
      const snap = await getDoc(ref);
      if (snap.exists()) setData({ id: snap.id, ...snap.data() });
      setLoading(false);
    };
    run();
  }, [id]);

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-10">Yükleniyor...</div>;
  if (!data) return <div className="mx-auto max-w-3xl px-4 py-10">Dergi bulunamadı.</div>;

  const pages: string[] = useMemo(() => {
    const raw: string = data.content || "";
    // First, try to split on explicit page breaks
    let parts = raw.split(/<hr[^>]*class=["']page-break["'][^>]*\/?>(?:\n|\r)?/i).map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) parts = [raw];
    return parts;
  }, [data?.content]);

  const title = data?.title || "Dergi Lumin";
  const authorName = data?.authorName || data?.author || "";
  const coverUrl = data?.coverImageUrl || data?.coverImage || null;

  return (
    <div className="min-h-screen bg-[#555] text-[var(--color-brown)]">
      <header className="sticky top-0 z-40 border-b border-black/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverUrl || "/logos/lumin-logo.jpg"} alt="Dergi Lumin" className="h-10 w-10 rounded-full object-cover border border-black/10" />
            <div className="leading-tight">
              <div className="font-serif text-lg text-[var(--color-purple)]">Dergi Lumin</div>
              <div className="text-[11px] text-[var(--color-brown)]/70 line-clamp-1">{title}</div>
            </div>
          </div>
          <div className="text-[11px] text-[var(--color-brown)]/70 text-right">
            {authorName ? <div className="line-clamp-1">{authorName}</div> : null}
            {data?.publishedAt?.toDate ? <div>{data.publishedAt.toDate().toLocaleDateString("tr-TR")}</div> : null}
          </div>
        </div>
      </header>

      {/* Book reader: flipbook or two-page spread */}
      <div className="relative mx-auto max-w-6xl px-4 py-6">
        <button
          type="button"
          onClick={() => bookRef.current?.prev?.()}
          disabled={page <= 0}
          className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-30 h-12 w-12 items-center justify-center rounded-full bg-white/90 border border-black/10 shadow-sm disabled:opacity-40"
          aria-label="Önceki sayfa"
        >
          ‹
        </button>

        <button
          type="button"
          onClick={() => bookRef.current?.next?.()}
          disabled={total ? page >= total - 1 : false}
          className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-30 h-12 w-12 items-center justify-center rounded-full bg-white/90 border border-black/10 shadow-sm disabled:opacity-40"
          aria-label="Sonraki sayfa"
        >
          ›
        </button>

        <div className="rounded-2xl bg-black/10 p-4 md:p-6">
          <BookFlip
            ref={bookRef}
            pages={pages}
            mode="alwaysFlip"
            initialPage={0}
            onPageChange={(info) => {
              setPage(info.page);
              setTotal(info.total);
            }}
          />
        </div>
      </div>

      <footer className="sticky bottom-0 z-40 border-t border-black/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="text-[11px] text-[var(--color-brown)]/70">Dergi Lumin</div>
          <div className="flex items-center gap-3 flex-1 justify-center">
            <div className="text-[11px] text-[var(--color-brown)]/70 w-16 text-center">
              {total ? `${page + 1}/${total}` : "-/-"}
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(0, total - 1)}
              value={Math.min(page, Math.max(0, total - 1))}
              onChange={(e) => bookRef.current?.goTo?.(Number(e.target.value))}
              className="w-full max-w-md"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => bookRef.current?.prev?.()}
              disabled={page <= 0}
              className="md:hidden rounded-full border border-black/10 bg-white px-3 py-1 text-xs disabled:opacity-40"
            >
              Önceki
            </button>
            <button
              type="button"
              onClick={() => bookRef.current?.next?.()}
              disabled={total ? page >= total - 1 : false}
              className="md:hidden rounded-full border border-black/10 bg-white px-3 py-1 text-xs disabled:opacity-40"
            >
              Sonraki
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
