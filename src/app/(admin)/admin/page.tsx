"use client";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { collection, query, orderBy, where, deleteDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { db, storage } from "@/lib/firebase";
import { deleteObject, ref as storageRef } from "firebase/storage";

export default function AdminHome() {
  const col = collection(db, "dergi");
  const qAll = query(col, orderBy("publishedAt", "desc"));
  const [allSnap, loading] = useCollection(qAll);

  const qDrafts = query(col, where("publishedAt", "==", null), orderBy("title", "asc"));
  const [draftSnap, loadingDrafts] = useCollection(qDrafts);

  const onDelete = async (id: string, coverPath?: string) => {
    if (!confirm("Bu dergiyi silmek istediğinize emin misiniz?")) return;
    await deleteDoc(doc(db, "dergi", id));
    if (coverPath) {
      try { await deleteObject(storageRef(storage, coverPath)); } catch {}
    }
  };

  const onPublish = async (id: string) => {
    await updateDoc(doc(db, "dergi", id), { publishedAt: serverTimestamp() });
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-serif text-3xl text-[var(--color-purple)]">Admin Paneli</h1>
          <Link href="/admin/new" className="rounded-full px-4 py-2 text-sm btn-primary">Yeni Dergi</Link>
        </div>
        <h2 className="mb-3 font-serif text-2xl text-[var(--color-purple)]">Yayınlanmışlar</h2>
        {loading && <p>Yükleniyor...</p>}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-10">
          {allSnap?.docs.filter(d => (d.data() as any)?.publishedAt).map((docu) => {
            const d = docu.data() as any;
            return (
              <div key={docu.id} className="rounded-2xl border border-black/5 overflow-hidden bg-white shadow-sm">
                <div className="aspect-[3/4] w-full bg-gradient-to-br from-[var(--color-pink)] to-[var(--color-purple)]" />
                <div className="p-4">
                  <h3 className="font-serif text-xl text-[var(--color-brown)]">{d.title}</h3>
                  <div className="mt-3 flex gap-2">
                    <Link href={`/magazine/${docu.id}`} className="text-sm underline">Görüntüle</Link>
                    <button onClick={() => onDelete(docu.id, d.coverPath)} className="text-sm text-red-600">Sil</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <h2 className="mb-3 font-serif text-2xl text-[var(--color-purple)]">Taslaklar</h2>
        {loadingDrafts && <p>Yükleniyor...</p>}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {draftSnap?.docs.map((docu) => {
            const d = docu.data() as any;
            return (
              <div key={docu.id} className="rounded-2xl border border-black/5 overflow-hidden bg-white shadow-sm">
                <div className="aspect-[3/4] w-full bg-white" />
                <div className="p-4">
                  <h3 className="font-serif text-xl text-[var(--color-brown)]">{d.title || "Başlıksız Taslak"}</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => onPublish(docu.id)} className="text-sm btn-primary rounded-full px-3 py-1">Yayınla</button>
                    <button onClick={() => onDelete(docu.id, d.coverPath)} className="text-sm text-red-600">Sil</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ProtectedRoute>
  );
}

