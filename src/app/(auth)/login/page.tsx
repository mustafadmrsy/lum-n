"use client";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const inviteToken = searchParams.get("inviteToken");

      // Normal giriş modu (davet yoksa): sadece sign-in dene
      if (!inviteToken) {
        await signInWithEmailAndPassword(auth, email, password);
        const redirect = searchParams.get("redirect");
        router.replace(redirect || "/admin");
        return;
      }

      // Davetli kayıt / giriş modu
      const invitesRef = collection(db, "invites");
      const q = query(invitesRef, where("token", "==", inviteToken), limit(1));
      const snap = await getDocs(q);

      if (snap.empty) {
        setError("Bu davetiye bulunamadı veya süresi dolmuş olabilir.");
        return;
      }

      const inviteDoc = snap.docs[0];
      const inviteData = inviteDoc.data() as any;

      if (inviteData.used) {
        setError("Bu davetiye zaten kullanılmış.");
        return;
      }

      if (inviteData.expiresAt && inviteData.expiresAt.toMillis && inviteData.expiresAt.toMillis() < Date.now()) {
        setError("Bu davetiyenin süresi dolmuş.");
        return;
      }

      if (inviteData.email && inviteData.email !== email) {
        setError("Bu davetiye farklı bir e-posta için oluşturulmuş. Lütfen davetteki adresi kullan.");
        return;
      }

      const role = inviteData.role || "admin";

      let userCredential;
      try {
        // Önce mevcut kullanıcı mı diye deneyelim
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } catch (err: any) {
        // Bazı Firebase sürümlerinde bulunamayan kullanıcı için de invalid-credential dönebiliyor.
        // Davet akışında bu iki durumda yeni kullanıcı oluşturmaya izin veriyoruz.
        if (err?.code === "auth/user-not-found" || err?.code === "auth/invalid-credential") {
          try {
            userCredential = await createUserWithEmailAndPassword(auth, email, password);
          } catch (createErr: any) {
            if (createErr?.code === "auth/email-already-in-use") {
              // Mail aslında zaten kayıtlı ama yanlış şifre girilmiş.
              throw new Error(
                "Bu e-posta adresiyle daha önce bir hesap açılmış. Lütfen mevcut şifrenle giriş yap veya farklı bir e-posta dene."
              );
            }
            throw createErr;
          }
        } else {
          throw err;
        }
      }

      const user = userCredential.user;

      const trimmedName = displayName.trim();
      if (trimmedName) {
        try {
          await updateProfile(user, { displayName: trimmedName });
        } catch {
          // Profil güncellenemese de Firestore tarafında saklanacak
        }
      }

      // Kullanıcı rolünü ata / güncelle
      const userRef = doc(db, "users", user.uid);
      await setDoc(
        userRef,
        {
          email: user.email || null,
          displayName: trimmedName || user.displayName || null,
          role,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Davet dokümanını işaretle
      await updateDoc(inviteDoc.ref, {
        used: true,
        usedByUserId: user.uid,
        usedAt: serverTimestamp(),
      });

      const redirect = searchParams.get("redirect");
      router.replace(redirect || "/admin");
    } catch (err: any) {
      setError(err?.message ?? "Giriş başarısız");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] grid place-items-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-center font-serif text-3xl text-[var(--color-purple)]">Dergi Lumin</h1>
        {searchParams.get("inviteToken") ? (
          <p className="mb-5 text-center text-xs text-[var(--color-brown)]/70">
            Sana gönderilen <span className="font-semibold">yazar daveti</span> ile ilk kez hesap oluşturuyorsun. Bu hesap
            dergi paneline erişebilen <span className="font-semibold">yazar/admin</span> hesabı olacak.
          </p>
        ) : (
          <p className="mb-5 text-center text-xs text-[var(--color-brown)]/70">
            Lütfen dergi paneline giriş yapmak için e-posta ve parolanı gir.
          </p>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          {searchParams.get("inviteToken") && (
            <div className="space-y-2">
              <label className="block text-sm text-[var(--color-brown)]">Kullanıcı adı</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--color-pink)]"
                placeholder="Dergide görünecek adın (örn. Musta Demirsoy)"
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="block text-sm text-[var(--color-brown)]">E‑posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-black/10 px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--color-pink)]"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-[var(--color-brown)]">Parola</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-black/10 px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--color-pink)]"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full py-2 font-medium btn-primary disabled:opacity-60"
          >
            {loading
              ? searchParams.get("inviteToken")
                ? "Hesap oluşturuluyor..."
                : "Giriş yapılıyor..."
              : searchParams.get("inviteToken")
              ? "Daveti Kullan ve Hesap Oluştur"
              : "Giriş Yap"}
          </button>
        </form>
      </div>
    </div>
  );
}
