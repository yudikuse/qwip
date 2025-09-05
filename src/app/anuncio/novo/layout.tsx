// src/app/anuncio/novo/layout.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionValue } from "@/lib/session";

export const runtime = "nodejs";

export default async function AnuncioNovoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Lê o cookie de sessão assinado (não use "use client" aqui)
  const jar = cookies();
  const raw = jar.get("qwip_session")?.value || "";

  // Verifica assinatura e expiração
  const session = await verifySessionValue(raw);
  if (!session.ok) {
    // Sem sessão -> volta para o fluxo de SMS
    redirect(`/verificar?redirect=${encodeURIComponent("/anuncio/novo")}`);
  }

  // Sessão ok -> renderiza a página normalmente
  return <>{children}</>;
}
