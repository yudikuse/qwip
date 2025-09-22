// src/app/auth/phone/page.tsx
"use client";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/**
 * Ponte de compatibilidade: redireciona /auth/phone para /verificar-sms
 * preservando o parâmetro `next`.
 */
export default function AuthPhone() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // lê o parâmetro next (ou usa /anunciar como padrão)
    const next = searchParams.get("next") || "/anunciar";
    router.replace(`/verificar-sms?next=${encodeURIComponent(next)}`);
  }, [searchParams, router]);

  return null;
}
