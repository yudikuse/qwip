// src/app/anuncio/novo/layout.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionValue } from "@/lib/session";

// Força SSR dinâmico e evita cache/otimização estática
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "default-no-store";

export default async function AnuncioNovoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Next 15 pode expor cookies() como Promise neste contexto
  const jar = await cookies();
  const raw = jar.get("qwip_session")?.value ?? "";

  // Sem cookie -> volta pro fluxo de verificação (OTP)
  if (!raw) {
    redirect(`/verificar?redirect=${encodeURIComponent("/anuncio/novo")}`);
  }

  const session = await verifySessionValue(raw);

  // Exige sessão válida E claim de telefone
  const phone = (session as any)?.claims?.phone;
  if (!session.ok || typeof phone !== "string" || phone.length < 5) {
    redirect(`/verificar?redirect=${encodeURIComponent("/anuncio/novo")}`);
  }

  return <>{children}</>;
}
