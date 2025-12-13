import { Suspense } from "react";
import NewMagazineClient from "./NewMagazineClient";

export const dynamic = "force-dynamic";

export default async function NewMagazinePage({
  searchParams,
}: {
  searchParams?: Promise<{ id?: string }>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const docId = sp?.id ?? null;
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-6" />}> 
      <NewMagazineClient docId={docId} />
    </Suspense>
  );
}

