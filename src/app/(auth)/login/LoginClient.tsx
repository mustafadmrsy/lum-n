"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";

export default function LoginClient({
  inviteToken,
  redirect,
}: {
  inviteToken: string | null;
  redirect: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const effectiveInviteToken = useMemo(() => {
    return inviteToken ?? searchParams.get("inviteToken");
  }, [inviteToken, searchParams]);

  const effectiveRedirect = useMemo(() => {
    return redirect ?? searchParams.get("redirect");
  }, [redirect, searchParams]);
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
      if (!effectiveInviteToken) {
        await signInWithEmailAndPassword(auth, email, password);
        router.replace(effectiveRedirect || "/admin");
        return;
      }

      let userCredential;
      try {
        // Invite akışında öncelik: yeni hesap oluştur (çoğu davetli kullanıcı yeni olacak)
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } catch (createErr: any) {
        // Hesap zaten varsa, bu defa giriş yapmayı dene
        if (createErr?.code === "auth/email-already-in-use") {
          userCredential = await signInWithEmailAndPassword(auth, email, password);
        } else {
          throw createErr;
        }
      }

      const user = userCredential.user;

      const inviteRef = doc(db, "invites", effectiveInviteToken);
      let inviteSnap;
      try {
        inviteSnap = await getDoc(inviteRef);
      } catch (e: any) {
        if (e instanceof FirebaseError && e.code === "permission-denied") {
          setError(
            "İzin hatası: Davet dokümanı okunamıyor. Invite token geçersiz olabilir, invite.used=true olabilir veya Firestore Rules farklı bir versiyon publish edilmiş olabilir. Firebase Console'da invites/{token} dokümanını kontrol et."
          );
          return;
        }
        throw e;
      }
      if (!inviteSnap.exists()) {
        setError("Bu davetiye bulunamadı veya süresi dolmuş olabilir.");
        return;
      }

      const inviteData = inviteSnap.data() as any;

      if (inviteData.used) {
        setError("Bu davetiye zaten kullanılmış.");
        return;
      }

      if (
        inviteData.expiresAt &&
        inviteData.expiresAt.toMillis &&
        inviteData.expiresAt.toMillis() < Date.now()
      ) {
        setError("Bu davetiyenin süresi dolmuş.");
        return;
      }

      if (inviteData.email && inviteData.email !== (user.email || email)) {
        setError(
          "Bu davetiye farklı bir e-posta için oluşturulmuş. Lütfen davetteki adresi kullan."
        );
        return;
      }

      const role = inviteData.role || "admin";

      const trimmedName = displayName.trim();
      if (trimmedName) {
        try {
          await updateProfile(user, { displayName: trimmedName });
        } catch {
          // ignore
        }
      }

      const userRef = doc(db, "users", user.uid);

      // 1) Önce kullanıcı dokümanını yaz (admin sisteme düşsün)
      try {
        await setDoc(
          userRef,
          {
            email: user.email || null,
            displayName: trimmedName || user.displayName || null,
            role,
            inviteToken: effectiveInviteToken,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (e: any) {
        if (e instanceof FirebaseError && e.code === "permission-denied") {
          setError(
            "İzin hatası: users koleksiyonuna rol yazılamadı. Firestore Rules publish edildi mi ve invite token gerçekten geçerli mi? (invites/{token} used=false olmalı)."
          );
          return;
        }
        throw e;
      }

      // 2) Invite used işaretlemesi best-effort (başarısız olsa da kullanıcı admin olarak kalmalı)
      try {
        await updateDoc(inviteRef, {
          used: true,
          usedByUserId: user.uid,
          usedAt: serverTimestamp(),
        });
      } catch (e: any) {
        console.warn("Invite used update failed", e);
      }

      router.replace(effectiveRedirect || "/admin");
    } catch (err: any) {
      if (err instanceof FirebaseError) {
        const code = err.code || "";
        if (code === "permission-denied") {
          setError(
            "İzin hatası: Firestore kuralları bu işlemi engelliyor. Firebase Console'da Firestore Rules'u publish ettiğinden ve davetin doğru olduğundan emin ol."
          );
          return;
        }

        if (code.startsWith("auth/")) {
          if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
            setError("Şifre hatalı veya bu e-postayla kayıt yok. Davetliysen yeni bir şifre belirleyip tekrar dene.");
            return;
          }
          if (code === "auth/email-already-in-use") {
            setError(
              "Bu e-posta adresiyle zaten hesap var. Daveti kullanmak için mevcut şifrenle giriş yapmalısın."
            );
            return;
          }
          if (code === "auth/operation-not-allowed") {
            setError(
              "Email/Password giriş açık değil. Firebase Console > Authentication > Sign-in method bölümünden Email/Password'u enable et."
            );
            return;
          }
          if (code === "auth/too-many-requests") {
            setError("Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.");
            return;
          }
          if (code === "auth/weak-password") {
            setError("Parola çok zayıf. En az 6 karakter bir parola gir.");
            return;
          }
        }

        setError(err.message || "Giriş başarısız");
        return;
      }

      setError(err?.message ?? "Giriş başarısız");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] grid place-items-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-center font-serif text-3xl text-[var(--color-purple)]">Dergi Lumin</h1>
        {effectiveInviteToken ? (
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
          {effectiveInviteToken && (
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
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full py-2 font-medium btn-primary disabled:opacity-60"
          >
            {loading
              ? effectiveInviteToken
                ? "Hesap oluşturuluyor..."
                : "Giriş yapılıyor..."
              : effectiveInviteToken
                ? "Daveti Kullan ve Hesap Oluştur"
                : "Giriş Yap"}
          </button>
        </form>
      </div>
    </div>
  );
}
