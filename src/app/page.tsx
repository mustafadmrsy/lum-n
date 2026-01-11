"use client";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { collection, query, orderBy } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "@/lib/firebase";

const CATEGORY_OPTIONS = [
  "Gündem",
  "Kültür & Sanat",
  "Edebiyat",
  "Yaşam",
  "Sağlık",
  "Teknoloji",
  "Seyahat",
  "Tasarım & Moda",
  "Müzik",
  "Sinema & TV",
  "Tarih",
  "Ekonomi & İş Dünyası",
  "Sosyal Medya & Dijital",
  "Eğitim",
  "Spor",
] as const;

export default function Home() {
  const col = collection(db, "dergi");
  const qAll = query(col, orderBy("publishedAt", "desc"));
  const [allSnap, loadingAll] = useCollection(qAll);

  const published = allSnap?.docs.filter((d) => {
    const data = d.data() as any;
    return data?.status === "published" || !!data?.publishedAt;
  }) || [];

  const [activeCategory, setActiveCategory] = useState<string>("Tümü");

  const knownCategories = useMemo(() => new Set<string>(CATEGORY_OPTIONS as unknown as string[]), []);

  const normalizeCategory = useCallback(
    (d: any): string => {
      const single = typeof d?.category === "string" ? d.category.trim() : "";
      const arr = Array.isArray(d?.categories) ? d.categories.filter(Boolean).map((x: any) => String(x).trim()) : [];
      const raw = single || arr[0] || "";
      if (!raw) return "Diğer";
      return knownCategories.has(raw) ? raw : "Diğer";
    },
    [knownCategories]
  );

  const categoryTabs = useMemo(() => {
    return ["Tümü", ...CATEGORY_OPTIONS, "Diğer"];
  }, []);

  const scopedPublished = useMemo(() => {
    if (activeCategory === "Tümü") return published;
    return published.filter((docu) => {
      const d = docu.data() as any;
      return normalizeCategory(d) === activeCategory;
    });
  }, [activeCategory, published, normalizeCategory]);

  const featured = scopedPublished[0] ?? null;
  const filtered = useMemo(() => {
    return scopedPublished;
  }, [scopedPublished]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of categoryTabs) m.set(t, 0);

    for (const docu of published) {
      const d = docu.data() as any;
      const cat = normalizeCategory(d);
      m.set("Tümü", (m.get("Tümü") || 0) + 1);
      m.set(cat, (m.get(cat) || 0) + 1);
    }

    return m;
  }, [published, categoryTabs, normalizeCategory]);

  const renderCard = (docu: any) => {
    const d = docu.data() as any;
    const cover = d.coverImageUrl || d.coverImage || null;
    const cat = normalizeCategory(d);
    return (
      <Link key={docu.id} href={`/magazine/${docu.id}`} className="group">
        <div className="mx-auto w-full max-w-[220px]">
          <div className="relative overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm transition-shadow group-hover:shadow-md">
            <div className="aspect-[3/4] w-full">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt={d.title || "Kapak"} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-[var(--color-pink)] to-[var(--color-purple)]" />
              )}
            </div>
            {cat !== "Diğer" && (
              <div className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] text-[var(--color-brown)] shadow-sm border border-black/10">
                {cat}
              </div>
            )}
          </div>
          <div className="mt-2 text-center">
            <div className="font-serif text-[15px] text-[var(--color-brown)] line-clamp-1">{d.title || "Başlıksız"}</div>
            <div className="text-[10px] text-[var(--color-brown)]/60 line-clamp-1">{d.authorName || ""}</div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="mb-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl text-[var(--color-purple)]">Sayılarımız</h1>
            <p className="mt-2 text-sm text-[var(--color-brown)]/70">
              Yayınlanan sayıları kapağından seçip flipbook olarak okuyabilirsin.
            </p>
          </div>
        </div>
      </section>

      {loadingAll && <p className="text-sm text-[var(--color-brown)]/70">Yükleniyor...</p>}

      {!loadingAll && published.length === 0 && (
        <div className="rounded-xl border border-black/5 bg-white p-6 text-center text-[var(--color-brown)]/70">
          Henüz yayınlanmış dergi bulunmuyor.
        </div>
      )}

      {published.length > 0 && (
        <>
          {featured && (
            <section className="mb-10">
              <div className="mb-4">
                <div className="text-[10px] uppercase tracking-wide text-[var(--color-brown)]/60">Son Yazımız</div>
                <h2 className="mt-1 font-serif text-2xl text-[var(--color-purple)]">{(featured.data() as any)?.title || "Başlıksız"}</h2>
              </div>

              <div className="flex justify-center">
                {renderCard(featured)}
              </div>
            </section>
          )}

          <section>
            <div className="mb-4">
              <div className="text-[10px] uppercase tracking-wide text-[var(--color-brown)]/60">Yazılarımız</div>
              <h2 className="mt-1 font-serif text-2xl text-[var(--color-purple)]">Kategoriler</h2>
            </div>

            <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-black/10 bg-white/70 p-2 shadow-sm overflow-x-auto">
              {categoryTabs.map((t) => {
                const active = t === activeCategory;
                const n = counts.get(t) || 0;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setActiveCategory(t)}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] transition-colors border ${
                      active
                        ? "bg-[var(--color-purple)] text-white border-transparent"
                        : "bg-white text-[var(--color-brown)]/70 border-black/10 hover:bg-[var(--color-purple)]/5 hover:text-[var(--color-purple)]"
                    }`}
                  >
                    <span className="whitespace-nowrap">{t}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] ${active ? "bg-white/15 text-white" : "bg-black/5 text-[var(--color-brown)]/70"}`}>
                      {n}
                    </span>
                  </button>
                );
              })}
            </div>

            {scopedPublished.length === 0 ? (
              <div className="rounded-xl border border-black/10 bg-white/70 p-6 text-center text-sm text-[var(--color-brown)]/70">
                Bu kategoride henüz yayın yok.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                {filtered.map(renderCard)}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

