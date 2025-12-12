"use client";
import { useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { collection, query, orderBy, deleteDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { auth, db, storage } from "@/lib/firebase";
import { deleteObject, ref as storageRef } from "firebase/storage";
import { useAuthState } from "react-firebase-hooks/auth";

type AdminTab = "overview" | "published" | "drafts" | "collab";

export default function AdminHome() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [authUser] = useAuthState(auth);

  const col = collection(db, "dergi");
  const qAll = query(col, orderBy("publishedAt", "desc"));
  const [allSnap, loading] = useCollection(qAll);

  const onDelete = async (id: string, coverPath?: string) => {
    if (!confirm("Bu dergiyi silmek istediğinize emin misiniz?")) return;
    await deleteDoc(doc(db, "dergi", id));
    if (coverPath) {
      try {
        await deleteObject(storageRef(storage, coverPath));
      } catch {}
    }
  };

  const onPublish = async (id: string) => {
    const lastEditedById = authUser?.uid || null;
    const lastEditedByName = authUser?.displayName || authUser?.email || null;
    await updateDoc(doc(db, "dergi", id), {
      status: "published",
      publishedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...(lastEditedById ? { lastEditedById } : {}),
      ...(lastEditedByName ? { lastEditedByName } : {}),
    });
  };

  const allDocs = allSnap?.docs || [];
  const publishedDocs = allDocs.filter((d) => {
    const data = d.data() as any;
    return data?.status === "published" || !!data?.publishedAt;
  });
  const draftDocs = allDocs.filter((d) => {
    const data = d.data() as any;
    // Legacy docs: status yoksa publishedAt null => taslak kabul
    return data?.status === "draft" || (!data?.publishedAt && data?.status !== "published");
  });

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl text-[var(--color-purple)]">Admin Paneli</h1>
            <p className="mt-1 text-sm text-[var(--color-brown)]/70">
              Dergi yazılarını, taslakları ve ekip içi görev akışını buradan yönetin.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/new"
              className="rounded-full px-4 py-2 text-sm btn-primary shadow-sm hover:shadow-md transition-shadow"
            >
              Yeni Dergi
            </Link>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2 rounded-full bg-white/40 p-1 shadow-sm border border-black/5">
          {[
            { id: "overview" as AdminTab, label: "Genel Bakış" },
            { id: "published" as AdminTab, label: "Yayınlananlar" },
            { id: "drafts" as AdminTab, label: "Taslaklar" },
            { id: "collab" as AdminTab, label: "Görevler & Sohbet" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[120px] rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-[var(--color-purple)] text-white shadow"
                  : "bg-transparent text-[var(--color-brown)]/70 hover:bg-white hover:text-[var(--color-purple)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/80 border border-black/5 p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-[var(--color-brown)]/60">Toplam Yazı</div>
                <div className="mt-2 text-2xl font-semibold text-[var(--color-brown)]">{allDocs.length}</div>
              </div>
              <div className="rounded-2xl bg-white/80 border border-black/5 p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-[var(--color-brown)]/60">Yayınlanan</div>
                <div className="mt-2 text-2xl font-semibold text-emerald-700">{publishedDocs.length}</div>
              </div>
              <div className="rounded-2xl bg-white/80 border border-black/5 p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-[var(--color-brown)]/60">Taslak</div>
                <div className="mt-2 text-2xl font-semibold text-amber-700">{draftDocs.length}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-white/90 border border-black/5 p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-serif text-xl text-[var(--color-purple)]">Son Yayınlananlar</h2>
                  <button
                    type="button"
                    className="text-xs text-[var(--color-purple)] hover:underline"
                    onClick={() => setActiveTab("published")}
                  >
                    Tümünü gör
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  {loading && <p className="text-[var(--color-brown)]/60">Yükleniyor...</p>}
                  {!loading && !publishedDocs.length && (
                    <p className="text-[var(--color-brown)]/60">Henüz yayınlanmış yazı yok.</p>
                  )}
                  {publishedDocs.slice(0, 4).map((docu) => {
                    const d = docu.data() as any;
                    const author = d.authorName || "-";
                    const lastEditor = d.lastEditedByName || author;
                    return (
                      <div
                        key={docu.id}
                        className="flex items-center justify-between rounded-lg border border-black/5 bg-white px-3 py-2"
                      >
                        <div className="flex-1 truncate">
                          <div className="truncate text-[var(--color-brown)] text-sm">
                            {d.title || "Başlıksız"}
                          </div>
                          <div className="text-[10px] text-[var(--color-brown)]/60">Yazar: {author}</div>
                          <div className="text-[10px] text-[var(--color-brown)]/60">Son düzenleyen: {lastEditor}</div>
                        </div>
                        <Link
                          href={`/magazine/${docu.id}`}
                          className="ml-3 text-xs text-[var(--color-purple)] hover:underline whitespace-nowrap"
                        >
                          Görüntüle
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl bg-white/90 border border-black/5 p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-serif text-xl text-[var(--color-purple)]">Taslak Kuyruğu</h2>
                  <button
                    type="button"
                    className="text-xs text-[var(--color-purple)] hover:underline"
                    onClick={() => setActiveTab("drafts")}
                  >
                    Taslaklara git
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  {loading && <p className="text-[var(--color-brown)]/60">Yükleniyor...</p>}
                  {!loading && !draftDocs.length && (
                    <p className="text-[var(--color-brown)]/60">Henüz kaydedilmiş taslak yok.</p>
                  )}
                  {draftDocs.slice(0, 5).map((docu) => {
                    const d = docu.data() as any;
                    const author = d.authorName || "-";
                    const lastEditor = d.lastEditedByName || author;
                    return (
                      <div
                        key={docu.id}
                        className="flex items-center justify-between rounded-lg border border-black/5 bg-white px-3 py-2"
                      >
                        <div className="flex-1 truncate">
                          <div className="truncate text-[var(--color-brown)] text-sm">
                            {d.title || "Başlıksız Taslak"}
                          </div>
                          <div className="text-[10px] text-[var(--color-brown)]/60">Yazar: {author}</div>
                          <div className="text-[10px] text-[var(--color-brown)]/60">Son düzenleyen: {lastEditor}</div>
                        </div>
                        <div className="ml-3 flex items-center gap-2">
                          <Link
                            href={`/admin/new?id=${docu.id}`}
                            className="text-xs text-[var(--color-purple)] hover:underline whitespace-nowrap"
                          >
                            Düzenle
                          </Link>
                          <Link
                            href={`/admin/preview/${docu.id}`}
                            className="text-xs text-[var(--color-purple)] hover:underline whitespace-nowrap"
                          >
                            Ön İzle
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === "published" && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-2xl text-[var(--color-purple)]">Yayınlanan Yazılar</h2>
              <p className="text-xs text-[var(--color-brown)]/70">Son yayınlanan içerikleri yönet.</p>
            </div>
            {loading && <p className="text-[var(--color-brown)]/60">Yükleniyor...</p>}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {publishedDocs.map((docu) => {
                const d = docu.data() as any;
                const author = d.authorName || "-";
                const lastEditor = d.lastEditedByName || author;
                return (
                  <div
                    key={docu.id}
                    className="rounded-2xl border border-black/5 overflow-hidden bg-white shadow-sm flex flex-col"
                  >
                    <div className="aspect-[3/4] w-full bg-gradient-to-br from-[var(--color-pink)] to-[var(--color-purple)]" />
                    <div className="p-4 flex flex-1 flex-col">
                      <h3 className="font-serif text-lg text-[var(--color-brown)] line-clamp-2">
                        {d.title || "Başlıksız"}
                      </h3>
                      <div className="mt-1 text-[11px] text-[var(--color-brown)]/60">Yazar: {author}</div>
                      <div className="text-[11px] text-[var(--color-brown)]/60">Son düzenleyen: {lastEditor}</div>
                      <div className="mt-3 flex flex-wrap gap-2 text-sm">
                        <Link href={`/magazine/${docu.id}`} className="underline text-[var(--color-purple)]">
                          Görüntüle
                        </Link>
                        <button
                          type="button"
                          onClick={() => onDelete(docu.id, d.coverPath)}
                          className="text-red-600 hover:underline"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === "drafts" && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-2xl text-[var(--color-purple)]">Taslaklar</h2>
              <p className="text-xs text-[var(--color-brown)]/70">Yayınlanmamış içerikleri gözden geçir.</p>
            </div>
            {loading && <p className="text-[var(--color-brown)]/60">Yükleniyor...</p>}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {draftDocs.map((docu) => {
                const d = docu.data() as any;
                const author = d.authorName || "-";
                const lastEditor = d.lastEditedByName || author;
                return (
                  <div
                    key={docu.id}
                    className="rounded-2xl border border-black/5 overflow-hidden bg-white shadow-sm flex flex-col"
                  >
                    <div className="aspect-[3/4] w-full bg-white" />
                    <div className="p-4 flex flex-1 flex-col">
                      <h3 className="font-serif text-lg text-[var(--color-brown)] line-clamp-2">
                        {d.title || "Başlıksız Taslak"}
                      </h3>
                      <div className="mt-1 text-[11px] text-[var(--color-brown)]/60">Yazar: {author}</div>
                      <div className="text-[11px] text-[var(--color-brown)]/60">Son düzenleyen: {lastEditor}</div>
                      <div className="mt-3 flex flex-wrap gap-2 text-sm">
                        <Link
                          href={`/admin/new?id=${docu.id}`}
                          className="text-[var(--color-purple)] underline"
                        >
                          Düzenle
                        </Link>
                        <Link
                          href={`/admin/preview/${docu.id}`}
                          className="text-[var(--color-purple)] underline"
                        >
                          Ön İzle
                        </Link>
                        <button
                          type="button"
                          onClick={() => onPublish(docu.id)}
                          className="btn-primary rounded-full px-3 py-1 text-xs"
                        >
                          Yayınla
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(docu.id, d.coverPath)}
                          className="text-red-600 hover:underline"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === "collab" && (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr,1fr]">
            <div className="rounded-2xl bg-white/95 border border-black/5 p-4 shadow-sm flex flex-col">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-serif text-xl text-[var(--color-purple)]">Görev Dağılımı</h2>
                <span className="text-[10px] uppercase tracking-wide text-[var(--color-brown)]/60">
                  Yazar İş Listesi
                </span>
              </div>
              <div className="mb-3 flex flex-wrap gap-2 text-xs">
                <button className="rounded-full border border-black/10 bg-white px-3 py-1">Yeni görev ekle</button>
                <button className="rounded-full border border-black/10 bg-white px-3 py-1 text-[var(--color-brown)]/70">
                  Filtreler
                </button>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto text-sm">
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-amber-900">Kapak yazısı taslağı</div>
                    <div className="text-[11px] text-amber-800/80">Atanan: (örnek) Yazar • Durum: Taslak</div>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800">Öncelik: Orta</span>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-emerald-900">Röportaj içeriği revizyon</div>
                    <div className="text-[11px] text-emerald-800/80">Atanan: (örnek) Editör • Durum: Yayında</div>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800">Tamamlandı</span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="font-medium text-slate-900">Yeni sayı planlama notları</div>
                  <div className="text-[11px] text-slate-700/80">Ekip içi planlama için notlar buraya gelecek.</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white/95 border border-black/5 p-4 shadow-sm flex flex-col">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-serif text-xl text-[var(--color-purple)]">Ekip Sohbeti</h2>
                <span className="text-[10px] uppercase tracking-wide text-[var(--color-brown)]/60">Editör Kanalı</span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto rounded-xl border border-black/5 bg-slate-50 px-3 py-2 text-xs">
                <div className="flex flex-col items-start gap-0.5">
                  <span className="font-semibold text-[var(--color-brown)] text-[11px]">Sen (örnek)</span>
                  <span className="rounded-2xl bg-white px-3 py-1 shadow-sm">
                    Yeni sayının kapağı için fikirleri buraya yazabilirsiniz.
                  </span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="font-semibold text-[var(--color-brown)] text-[11px]">Yazar (örnek)</span>
                  <span className="rounded-2xl bg-[var(--color-purple)] text-white px-3 py-1 shadow-sm">
                    Tamam, 3 taslak hazırlayıp buraya atacağım.
                  </span>
                </div>
                <div className="mt-2 text-[10px] text-[var(--color-brown)]/60">
                  Gerçek zamanlı sohbet entegrasyonu (ör. Firestore veya başka bir servis) daha sonra bağlanacak.
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Mesaj yaz (şimdilik sadece tasarım)"
                  className="flex-1 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs outline-none"
                />
                <button className="rounded-full bg-[var(--color-purple)] px-3 py-1.5 text-xs text-white shadow-sm">
                  Gönder
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </ProtectedRoute>
  );
}

