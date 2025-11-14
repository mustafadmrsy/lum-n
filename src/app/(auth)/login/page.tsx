"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { isAdminEmail } from "@/lib/adminAllowlist";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      if (!isAdminEmail(cred.user.email)) {
        setError("Bu hesap admin yetkisine sahip değil.");
        setLoading(false);
        return;
      }
      router.replace("/admin");
    } catch (err: any) {
      setError(err?.message ?? "Giriş başarısız");
    } finally {
      setLoading(false);
    }
  };

  const enableDevSignup = process.env.NEXT_PUBLIC_ENABLE_DEV_SIGNUP === "true";
  const defaultDevEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",")[0]?.trim() || "mustafadmrsy125@gmail.com";
  const defaultDevPassword = "12345678";

  const onDevCreateAdmin = async () => {
    setError(null);
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, defaultDevEmail, defaultDevPassword);
    } catch (err: any) {
      // Hesap zaten varsa veya farklı hata olabilir; mesajı kullanıcıya iletelim
      setError(err?.message ?? "Kullanıcı oluşturma hatası");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] grid place-items-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-center font-serif text-3xl text-[var(--color-purple)]">Dergi Lumin</h1>
        <form onSubmit={onSubmit} className="space-y-4">
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
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
        {enableDevSignup && (
          <div className="mt-4 space-y-2 text-center">
            <p className="text-xs text-[var(--color-brown)]/60">Geliştirici kısayolu: varsayılan admin hesabını oluştur</p>
            <button
              type="button"
              disabled={loading}
              onClick={onDevCreateAdmin}
              className="w-full rounded-full py-2 border border-black/10 text-sm"
            >
              Admin oluştur ({defaultDevEmail} / {defaultDevPassword})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
