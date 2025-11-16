"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { UserRole } from "@/types/models";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

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

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/10 bg-[#800020]/95 backdrop-blur-md shadow-lg">
      <div className="mx-auto max-w-7xl px-6 py-2 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          {/* Logo büyük ama header dar */}
          <img
            src="/logos/lumin-logo.jpg"
            alt="Dergi Lumin"
            className="h-20 w-20 rounded-full object-cover ring-4 ring-white/60 shadow-xl transition-transform duration-300 hover:scale-110"
          />
        </Link>
        <nav className="flex items-center gap-4">
          {navItem("/", "Ana Sayfa")}
          {navItem("/hakkinda", "Hakkında")}
          
          {user ? (
            <>
              {(user.role === UserRole.WRITER || user.role === UserRole.EDITOR || user.role === UserRole.ADMIN) && (
                navItem("/admin", "Admin")
              )}
              <div className="flex items-center gap-3">
                <span className="text-white/80 text-sm">
                  {user.displayName}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-full text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 hover:scale-105 transition-all duration-200"
                >
                  Çıkış
                </button>
              </div>
            </>
          ) : (
            <>
              {navItem("/login", "Giriş")}
              {navItem("/register", "Kayıt Ol")}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
