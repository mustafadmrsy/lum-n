"use client";
import Link from "next/link";
import { useCallback, useMemo } from "react";
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

  const featured = published[0] ?? null;
  const rest = useMemo(() => published.slice(1), [published]);

  const renderCard = (docu: any, variant: "small" | "large" = "small") => {
    const d = docu.data() as any;
    const cover = d.coverImageUrl || d.coverImage || null;
    const cat = normalizeCategory(d);
    const isLarge = variant === "large";
    return (
      <Link key={docu.id} href={`/magazine/${docu.id}`} className="group block">
        <div className={`mx-auto w-full ${isLarge ? "max-w-[260px]" : "max-w-[180px]"}`}>
          <div className={`relative overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm transition-shadow group-hover:shadow-md ${isLarge ? "rounded-xl" : ""}`}>
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
          <div className={`mt-2 text-center ${isLarge ? "mt-3" : ""}`}>
            <div className={`font-serif text-[var(--color-brown)] line-clamp-1 ${isLarge ? "text-[16px]" : "text-[13px]"}`}>{d.title || "Başlıksız"}</div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="bg-[#f5eadf]">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <section className="mb-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-4xl text-[var(--color-purple)]">Son yazımız</h1>
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
              <section className="mb-12">
                <div className="mb-4 text-center">
                  <div className="text-[10px] uppercase tracking-wide text-[var(--color-brown)]/60">Son Sayı</div>
                  <h2 className="mt-1 font-serif text-2xl text-[var(--color-purple)]">{(featured.data() as any)?.title || "Başlıksız"}</h2>
                </div>

                <div className="flex justify-center">{renderCard(featured, "large")}</div>
              </section>
            )}

            <section className="mb-14">
              <div className="mb-5 text-center">
                <h2 className="font-serif text-2xl text-[var(--color-purple)]">Sayılarımız</h2>
              </div>

              <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 sm:gap-5 lg:grid-cols-5">
                {rest.map((docu) => renderCard(docu, "small"))}
              </div>
            </section>

            <section className="mb-6">
              <div className="mb-4">
                <h2 className="font-serif text-2xl text-[var(--color-purple)]">Yazılarımız</h2>
              </div>

              <div className="max-w-3xl">
                <ul className="mt-1 list-disc pl-5 text-[15px] leading-7 text-[var(--color-brown)]">
                  {published.slice(0, 8).map((docu) => {
                    const d = docu.data() as any;
                    return (
                      <li key={docu.id} className="mb-2">
                        <Link
                          href={`/magazine/${docu.id}`}
                          className="underline decoration-[var(--color-brown)]/25 underline-offset-4 hover:text-[var(--color-purple)] hover:decoration-[var(--color-purple)]/40"
                        >
                          {d.title || "Başlıksız"}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

