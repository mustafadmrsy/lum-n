"use client";
import { useEffect, useMemo, useState } from "react";
import BookFlip from "@/components/BookFlip";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function MagazineDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [spread, setSpread] = useState(0);
  const [useFlip, setUseFlip] = useState(true);

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

  const maxSpreadIndex = Math.max(0, pages.length - 2);
  const leftIdx = spread;
  const rightIdx = spread + 1;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6">
        <h1 className="font-serif text-4xl text-[var(--color-purple)]">{data.title}</h1>
        <div className="mt-2 text-sm text-[var(--color-brown)]/70">
          <span>Yazar: {data.author || "Anonim"}</span>
          {data.publishedAt?.toDate && (
            <span> • {data.publishedAt.toDate().toLocaleDateString("tr-TR")}</span>
          )}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-[var(--color-brown)]/70">Görünüm</div>
        <div className="flex gap-2">
          <button
            className={`rounded-full px-3 py-1 text-sm border ${useFlip ? 'btn-primary border-transparent' : 'border-black/10'}`}
            onClick={() => setUseFlip(true)}
          >Flipbook</button>
          <button
            className={`rounded-full px-3 py-1 text-sm border ${!useFlip ? 'btn-primary border-transparent' : 'border-black/10'}`}
            onClick={() => setUseFlip(false)}
          >Klasik</button>
        </div>
      </div>

      {/* Book reader: flipbook or two-page spread */}
      {useFlip ? (
        <div className="rounded-2xl bg-[var(--color-brown)]/10 p-6">
          <BookFlip pages={pages} />
        </div>
      ) : (
      <div className="rounded-2xl bg-[var(--color-brown)]/10 p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[leftIdx, rightIdx].map((idx) => (
            <div key={idx} className="bg-white shadow-sm border border-black/10">
              <div className="relative min-h-[750px] max-h-[85vh] overflow-auto" style={{
                // page container defaults; positioned textboxes inside carry inline styles
              }}>
                {/* Render saved page HTML */}
                <div className="p-8 prose max-w-none" dangerouslySetInnerHTML={{ __html: pages[idx] || "" }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <button
            className="rounded-full border border-black/10 px-4 py-2 text-sm"
            onClick={() => setSpread((s) => Math.max(0, s - 2))}
            disabled={spread === 0}
          >Önceki Çift</button>
          <div className="text-sm text-[var(--color-brown)]/70">Sayfalar {leftIdx + 1}{pages[rightIdx] ? `–${rightIdx + 1}` : ""} / {pages.length}</div>
          <button
            className="rounded-full border border-black/10 px-4 py-2 text-sm"
            onClick={() => setSpread((s) => Math.min(maxSpreadIndex, s + 2))}
            disabled={spread >= maxSpreadIndex}
          >Sonraki Çift</button>
        </div>
      </div>
      )}

      <div className="mt-6">
        <button className="rounded-full px-4 py-2 text-sm btn-primary" onClick={() => window.print()}>PDF olarak indir</button>
      </div>
    </div>
  );
}
