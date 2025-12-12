"use client";
import Link from "next/link";
import { collection, query, orderBy } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "@/lib/firebase";

export default function Home() {
  const col = collection(db, "dergi");
  const qAll = query(col, orderBy("publishedAt", "desc"));
  const [allSnap, loadingAll] = useCollection(qAll);

  const published = allSnap?.docs.filter((d) => {
    const data = d.data() as any;
    return data?.status === "published" || !!data?.publishedAt;
  }) || [];

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
        <section>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {published.map((docu) => {
              const d = docu.data() as any;
              const cover = d.coverImageUrl || d.coverImage || null;
              return (
                <Link
                  key={docu.id}
                  href={`/magazine/${docu.id}`}
                  className="group"
                >
                  <div className="mx-auto w-full max-w-[260px]">
                    <div className="relative overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm transition-shadow group-hover:shadow-md">
                      <div className="aspect-[3/4] w-full">
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cover}
                            alt={d.title || "Kapak"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-[var(--color-pink)] to-[var(--color-purple)]" />
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-center">
                      <div className="font-serif text-lg text-[var(--color-brown)] line-clamp-1">{d.title || "Başlıksız"}</div>
                      <div className="text-[11px] text-[var(--color-brown)]/60 line-clamp-1">{d.authorName || ""}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

