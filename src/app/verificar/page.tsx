// src/app/verificar/page.tsx
import { Suspense } from "react";
import { VerifyClient } from "./verify-client";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <VerifyClient />
    </Suspense>
  );
}
