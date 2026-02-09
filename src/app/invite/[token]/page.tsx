import { redirect } from "next/navigation";

export default async function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const p = await params;
  const token = p?.token || "";
  if (!token) redirect("/");
  redirect(`/login?inviteToken=${encodeURIComponent(token)}`);
}
