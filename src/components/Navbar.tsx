"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

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
          {navItem("/login", "Giriş")}
        </nav>
      </div>
    </header>
  );
}
