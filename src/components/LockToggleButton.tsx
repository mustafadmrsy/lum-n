"use client";
import { useNavigationLock } from "@/context/NavigationLockContext";
import { usePathname } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { isAdminEmail } from "@/lib/adminAllowlist";

export default function LockToggleButton() {
  const { isLocked, toggle } = useNavigationLock();
  const pathname = usePathname();
  const [user, loading] = useAuthState(auth);

  if (loading) return null;

  const isAdmin = !!user && isAdminEmail(user.email || undefined);
  const isAllowedPath = !!pathname && (pathname === "/admin" || pathname === "/admin/new" || pathname.startsWith("/magazine/"));

  if (!isAdmin || !isAllowedPath) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      title={isLocked ? "Gezinmeyi kilidi kapalı (tıkla: aç)" : "Gezinme kilidi açık değil (tıkla: kilitle)"}
      className={`fixed bottom-4 right-4 z-[60] rounded-full px-4 py-2 shadow-lg transition-colors
      ${isLocked ? "bg-[#800020] text-white" : "bg-white text-[#800020] border border-[#800020]/30"}`}
    >
      {isLocked ? "Kilit Kapalı" : "Kilit Açık"}
    </button>
  );
}
