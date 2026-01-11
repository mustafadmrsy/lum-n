"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import BookFlip from "@/components/BookFlip";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function MagazineDetailPage() {
  const params = useParams();
  const router = useRouter();
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
  const category = data?.category || (Array.isArray(data?.categories) ? data.categories[0] : "");
  const coverUrl = data?.coverImageUrl || data?.coverImage || null;
  const publishedDate = data?.publishedAt?.toDate ? data.publishedAt.toDate().toLocaleDateString("tr-TR") : "";
  const progressPct = total > 0 ? Math.round(((page + 1) / total) * 100) : 0;

  return (
    <div className="h-dvh bg-[#555] text-[var(--color-brown)] flex flex-col overflow-hidden">
      <header className="z-40 border-b border-white/10 bg-[#1a1412] text-white shrink-0">
        <div className="mx-auto max-w-6xl px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => router.back()}
              className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white hover:bg-white/10"
              aria-label="Geri"
            >
              ←
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverUrl || "/logos/lumin-logo.jpg"} alt="Dergi Lumin" className="h-8 w-8 rounded-full object-cover border border-white/10" />
            <div className="leading-tight min-w-0">
              <div className="font-serif text-[13px] text-white line-clamp-1">{title}</div>
              <div className="text-[11px] text-white/70 line-clamp-1">
                {category ? category : null}
                {category && (publishedDate || authorName) ? " • " : null}
                {publishedDate ? publishedDate : null}
                {publishedDate && authorName ? " • " : null}
                {authorName ? authorName : null}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[11px] text-white/70">{total ? `${page + 1}/${total}` : "-/-"}</div>
            <div className="text-[11px] text-white/70">{total ? `%${progressPct}` : ""}</div>
          </div>
        </div>
      </header>

      {/* Book reader: flipbook or two-page spread */}
      <div className="relative mx-auto max-w-6xl w-full flex-1 min-h-0 px-3 py-3">
        <button
          type="button"
          onClick={() => bookRef.current?.prev?.()}
          disabled={page <= 0}
          className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-30 h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white border border-white/10 shadow-sm disabled:opacity-40"
          aria-label="Önceki sayfa"
        >
          ‹
        </button>

        <button
          type="button"
          onClick={() => bookRef.current?.next?.()}
          disabled={total ? page >= total - 1 : false}
          className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-30 h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white border border-white/10 shadow-sm disabled:opacity-40"
          aria-label="Sonraki sayfa"
        >
          ›
        </button>

        <div className="h-full rounded-2xl bg-black/20 p-3 md:p-4 overflow-hidden flex items-center justify-center">
          <div className="h-full w-full">
            <BookFlip
              ref={bookRef}
              pages={pages}
              mode="alwaysFlip"
              showSpreadDivider
              initialPage={0}
              onPageChange={(info) => {
                setPage(info.page);
                setTotal(info.total);
              }}
            />
          </div>
        </div>
      </div>

      <footer className="z-40 border-t border-white/10 bg-[#1a1412] text-white shrink-0">
        <div className="mx-auto max-w-6xl px-3 py-2 flex items-center justify-between gap-3">
          <div className="text-[11px] text-white/70">Dergi Lumin</div>
          <div className="flex items-center gap-3 flex-1 justify-center">
            <div className="text-[11px] text-white/70 w-16 text-center">
              {total ? `${page + 1}/${total}` : "-/-"}
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(0, total - 1)}
              value={Math.min(page, Math.max(0, total - 1))}
              onChange={(e) => bookRef.current?.goTo?.(Number(e.target.value))}
              className="w-full max-w-md accent-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => bookRef.current?.prev?.()}
              disabled={page <= 0}
              className="md:hidden rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs disabled:opacity-40"
            >
              Önceki
            </button>
            <button
              type="button"
              onClick={() => bookRef.current?.next?.()}
              disabled={total ? page >= total - 1 : false}
              className="md:hidden rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs disabled:opacity-40"
            >
              Sonraki
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
