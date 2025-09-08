// src/app/verificar/page.tsx
import { Suspense } from "react";
import VerifyClient from "./verify-client";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-neutral-400">Carregando…</div>}>
      <VerifyClient />
    </Suspense>
  );
}
