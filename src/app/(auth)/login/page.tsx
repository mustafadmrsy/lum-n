import { Suspense } from "react";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { inviteToken?: string; redirect?: string };
}) {
  const inviteToken = searchParams?.inviteToken ?? null;
  const redirect = searchParams?.redirect ?? null;

  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <LoginClient inviteToken={inviteToken} redirect={redirect} />
    </Suspense>
  );
}
