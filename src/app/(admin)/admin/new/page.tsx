import { Suspense } from "react";
import NewMagazineClient from "./NewMagazineClient";

export const dynamic = "force-dynamic";

export default function NewMagazinePage({
  searchParams,
}: {
  searchParams?: { id?: string };
}) {
  const docId = searchParams?.id ?? null;
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-6" />}> 
      <NewMagazineClient docId={docId} />
    </Suspense>
  );
}

