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
  // Em Next 15, cookies() pode ser assíncrono neste contexto
  const jar = await cookies();
  const raw = jar.get("qwip_session")?.value ?? "";

  // Verifica assinatura/expiração da sessão (emitida após OTP)
  const session = await verifySessionValue(raw);
  if (!session.ok) {
    redirect(`/verificar?redirect=${encodeURIComponent("/anuncio/novo")}`);
  }

  return <>{children}</>;
}
