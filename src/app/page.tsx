"use client";
import Link from "next/link";
import { collection, query, orderBy } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "@/lib/firebase";

export default function Home() {
  const col = collection(db, "dergi");
  const qAll = query(col, orderBy("publishedAt", "desc"));
  const [allSnap, loadingAll] = useCollection(qAll);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Hero: Son Sayı */}
      <section className="mb-10">
        <h1 className="sr-only">Dergi Lumin</h1>
        {(loadingAll) && <p>Yükleniyor...</p>}
        {allSnap?.docs?.[0] ? (() => {
          // İlk yayınlanmışı bul (publishedAt dolu olan ilk doküman)
          const first = allSnap.docs.find((d) => (d.data() as any)?.publishedAt) || allSnap.docs[0];
          const d = first.data() as any;
          return (
            <Link href={`/magazine/${first.id}`} className="group block">
              <div className="w-full overflow-hidden rounded-xl bg-white border border-black/5">
                {d.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.coverImage}
                    alt={d.title}
                    className="w-full h-80 object-cover transition-opacity group-hover:opacity-95"
                  />
                ) : (
                  <div className="h-80 bg-gradient-to-br from-[var(--color-pink)] to-[var(--color-purple)]" />
                )}
                <div className="p-5">
                  <h2 className="font-serif text-3xl text-[var(--color-purple)] group-hover:underline">
                    {d.title}
                  </h2>
                </div>
              </div>
            </Link>
          );
        })() : (
          <div className="rounded-xl border border-black/5 bg-white p-6 text-center text-[var(--color-brown)]/70">Henüz yayınlanmış dergi bulunmuyor.</div>
        )}
      </section>

      {/* Yazılarımız: Minimal başlık listesi */}
      <section>
        <h2 className="mb-4 font-serif text-2xl text-[var(--color-purple)]">Yazılarımız</h2>
        {(loadingAll) && <p>Yükleniyor...</p>}
        {allSnap?.docs?.length ? (
          <ul className="space-y-2">
            {allSnap.docs
              .filter((docu) => (docu.data() as any)?.publishedAt)
              .map((docu) => {
                const d = docu.data() as any;
              return (
                <li key={docu.id}>
                  <Link href={`/magazine/${docu.id}`} className="underline decoration-1 underline-offset-2 hover:decoration-2">
                    {d.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          !loadingAll && <p className="text-[var(--color-brown)]/70">Listelenecek yazı bulunamadı.</p>
        )}
      </section>

      {/* Hakkımızda (kısa) */}
      <section className="mt-12">
        <h2 className="mb-3 font-serif text-2xl text-[var(--color-purple)]">Hakkımızda</h2>
        <p className="text-[var(--color-brown)]/80">
          Dergi Lumin; kültür, sanat ve edebiyat odağında genç kalemlerin sesini duyurmayı hedefleyen
          dijital bir dergidir. Minimal ve okunabilir tasarım ile içerik odağını korur.
        </p>
      </section>
    </div>
  );
}

