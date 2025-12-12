"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user] = useAuthState(auth);
  const [open, setOpen] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);

  const navItem = (href: string, label: string) => (
    <Link
      href={href}
      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
        pathname === href
          ? "bg-white text-[#800020] shadow-md"
          : "text-white/90 hover:text-white hover:bg-white/10 hover:scale-105"
      }`}
    >
      {label}
    </Link>
  );

  useEffect(() => {
    let cancelled = false;
    const loadName = async () => {
      if (!user) {
        if (!cancelled) setProfileName(null);
        return;
      }
      // Önce Auth profilindeki displayName'i kullan
      if (user.displayName && !cancelled) {
        setProfileName(user.displayName);
      }
      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        const data = snap.data() as any;
        if (!cancelled && data?.displayName) {
          setProfileName(String(data.displayName));
        }
      } catch {
        // Firestore okunamazsa sessizce geç
      }
    };
    loadName();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/");
    setOpen(false);
  };

  const displayName = profileName || user?.displayName || user?.email || "Profil";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/10 bg-[#800020]/95 backdrop-blur-md shadow-lg">
      <div className="mx-auto max-w-7xl px-6 py-2 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <img
            src="/logos/lumin-logo.jpg"
            alt="Dergi Lumin"
            className="h-20 w-20 rounded-full object-cover ring-4 ring-white/60 shadow-xl transition-transform duration-300 hover:scale-110"
          />
        </Link>
        <nav className="flex items-center gap-4">
          {navItem("/", "Ana Sayfa")}
          {navItem("/hakkinda", "Hakkında")}

          {!user && navItem("/login", "Giriş")}

          {user && (
            <div className="relative flex items-center text-xs text-white/90">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 border border-white/20 hover:bg-white/20 transition-colors"
              >
                <div className="h-7 w-7 rounded-full bg-white/90 text-[#800020] flex items-center justify-center text-[11px] font-semibold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[120px] truncate hidden sm:inline">{displayName}</span>
                <span className="ml-1 text-[10px] opacity-80">▾</span>
              </button>

              {open && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white text-[11px] text-[var(--color-brown)] shadow-xl border border-black/5 z-50">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-black/5 bg-[var(--color-purple)]/5">
                    <div className="h-7 w-7 rounded-full bg-[var(--color-purple)] text-white flex items-center justify-center text-[11px] font-semibold">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-[11px] font-semibold">{displayName}</div>
                      <div className="text-[10px] text-[var(--color-brown)]/70">Yazar / Admin Paneli</div>
                    </div>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/admin"
                      onClick={() => setOpen(false)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-[11px] hover:bg-[var(--color-purple)]/5"
                    >
                      <span>Admin Paneline Git</span>
                      <span className="text-[10px] text-[var(--color-brown)]/70">/admin</span>
                    </Link>
                    <Link
                      href="/admin/new"
                      onClick={() => setOpen(false)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-[11px] hover:bg-[var(--color-purple)]/5"
                    >
                      <span>Yeni Dergi Yazısı</span>
                      <span className="text-[10px] text-[var(--color-brown)]/70">/admin/new</span>
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-[11px] text-red-700 hover:bg-red-50 border-t border-black/5"
                  >
                    <span>Çıkış Yap</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
