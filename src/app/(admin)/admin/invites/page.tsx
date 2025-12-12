"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { db } from "@/lib/firebase";
import { addDoc, collection, deleteDoc, doc, getDocs, limit, orderBy, query, serverTimestamp } from "firebase/firestore";

type Invite = {
  id: string;
  token: string;
  email?: string | null;
  role: string;
  createdAt?: any;
  expiresAt?: any;
  used?: boolean;
  usedByUserId?: string;
};

export default function AdminInvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("admin");
  const [daysValid, setDaysValid] = useState(7);

  const loadInvites = async () => {
    setLoading(true);
    try {
      const ref = collection(db, "invites");
      const q = query(ref, orderBy("createdAt", "desc"), limit(50));
      const snap = await getDocs(q);
      const list: Invite[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setInvites(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvites();
  }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    try {
      const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
      const ref = collection(db, "invites");
      const now = new Date();
      const expires = new Date(now.getTime() + daysValid * 24 * 60 * 60 * 1000);
      await addDoc(ref, {
        token,
        email: email.trim() || null,
        role,
        createdAt: serverTimestamp(),
        expiresAt: expires,
        used: false,
      });
      setEmail("");
      setRole("admin");
      setDaysValid(7);
      await loadInvites();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const onDeleteInvite = async (id: string) => {
    if (!confirm("Bu daveti silmek istediğine emin misin?")) return;
    try {
      await deleteDoc(doc(db, "invites", id));
      await loadInvites();
    } catch (err) {
      console.error(err);
    }
  };

  const baseUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.origin;
  }, []);

  const formatDate = (v: any) => {
    if (!v) return "-";
    try {
      if (v.toDate) return v.toDate().toLocaleString();
      if (v instanceof Date) return v.toLocaleString();
      return String(v);
    } catch {
      return String(v);
    }
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-4 flex flex-col gap-1">
          <h1 className="font-serif text-2xl text-[var(--color-purple)]">Yazar Davetleri</h1>
          <p className="text-sm text-[var(--color-brown)]/70">
            Yeni yazar / editörler için davet linkleri oluştur, durumlarını takip et ve gerekirse davetleri iptal et.
          </p>
        </div>

        <form
          onSubmit={onCreate}
          className="mb-6 rounded-2xl border border-black/10 bg-white/95 p-4 shadow-sm space-y-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-[var(--color-brown)]/80 mb-1">E-posta (opsiyonel)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-full border border-black/10 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-pink)]"
                placeholder="Sadece belirli bir mail için kısıtlamak istersen"
              />
              <p className="mt-1 text-[10px] text-[var(--color-brown)]/60">
                Boş bırakırsan linki alan herkes (ilk kullanan) kendi hesabını oluşturabilir.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-brown)]/80 mb-1">Rol</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-pink)]"
              >
                <option value="admin">Admin / Yazar</option>
                <option value="editor">Editör</option>
                <option value="reader">Sadece okuyucu</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-brown)]/80 mb-1">Geçerlilik (gün)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={daysValid}
                onChange={(e) => setDaysValid(Number(e.target.value || 7))}
                className="w-24 rounded-full border border-black/10 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-pink)]"
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--color-brown)]/60">
            <span>
              Oluşturulan davetler aşağıdaki listede görünecek. Kullanıldıktan sonra otomatik olarak "Kullanıldı" durumuna geçer.
            </span>
            <button
              type="submit"
              disabled={creating}
              className="rounded-full border border-black/10 bg-[var(--color-purple)] px-4 py-1.5 text-sm text-white disabled:opacity-60"
            >
              {creating ? "Oluşturuluyor..." : "Yeni davet linki oluştur"}
            </button>
          </div>
        </form>

        <div className="rounded-2xl border border-black/10 bg-white/95 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--color-brown)]">Son davetler</h2>
            {loading && <span className="text-xs text-[var(--color-brown)]/60">Yükleniyor...</span>}
          </div>
          {invites.length === 0 && !loading && (
            <div className="text-xs text-[var(--color-brown)]/60">Henüz oluşturulmuş bir davet yok.</div>
          )}
          {invites.length > 0 && (
            <div className="space-y-2 text-xs text-[var(--color-brown)]/80 max-h-80 overflow-y-auto">
              {invites.map((inv) => {
                const inviteUrl = baseUrl ? `${baseUrl}/invite/${inv.token}` : `/invite/${inv.token}`;
                return (
                  <div
                    key={inv.id}
                    className="rounded-xl border border-black/10 bg-white px-3 py-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-0.5">
                      <div className="font-medium text-[var(--color-brown)]">
                        {inv.email || "Genel davetiye"}
                      </div>
                      <div className="text-[10px] text-[var(--color-brown)]/60">
                        Rol: {inv.role || "admin"} • Oluşturulma: {formatDate(inv.createdAt)} • Bitiş: {formatDate(inv.expiresAt)}
                      </div>
                      <div className="inline-flex items-center gap-1 rounded-full bg-black/3 px-2 py-1">
                        <span className="text-[9px] uppercase tracking-wide text-[var(--color-brown)]/60">Bağlantı</span>
                        <span className="break-all text-[10px] text-[var(--color-brown)]/80">{inviteUrl}</span>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center gap-2 sm:mt-0">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ${
                          inv.used
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                        }`}
                      >
                        {inv.used ? "Kullanıldı" : "Bekliyor"}
                      </span>
                      <button
                        type="button"
                        className="rounded-full border border-black/10 bg-white px-2 py-0.5 text-[10px]"
                        onClick={() => {
                          if (navigator?.clipboard) {
                            navigator.clipboard.writeText(inviteUrl);
                          }
                        }}
                      >
                        Kopyala
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] text-red-700 hover:bg-red-100"
                        onClick={() => onDeleteInvite(inv.id)}
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
