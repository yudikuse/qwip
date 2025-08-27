// src/app/vitrine/page.tsx
import { Suspense } from "react";
import VitrineClient from "./VitrineClient";

// evita export estático e deixa dinâmico (opcional, mas seguro com searchParams)
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<main className="max-w-6xl mx-auto px-4 py-10">Carregando…</main>}>
      <VitrineClient />
    </Suspense>
  );
}



