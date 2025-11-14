export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";
  const list = raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.toLowerCase());
}
