// src/app/anuncio/novo/layout.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionValue } from "@/lib/session";

export const runtime = "nodejs";              // garante Node (não Edge) p/ WebCrypto
export const dynamic = "force-dynamic";       // impede render estático e usa cookies atuais
export const revalidate = 0;
export const fetchCache = "default-no-store";

export default async function AnuncioNovoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Lê cookie HttpOnly no servidor
  const jar = await cookies();
  const raw = jar.get("qwip_session")?.value ?? "";

  // Sem sessão? Vai para o OTP.
  if (!raw) {
    redirect(`/verificar?redirect=${encodeURIComponent("/anuncio/novo")}`);
  }

  // Confere assinatura e expiração
  const session = await verifySessionValue(raw);
  const phone = (session as any)?.claims?.phone;

  // Sessão inválida/expirada → força voltar ao OTP
  if (!session.ok || typeof phone !== "string" || phone.length < 5) {
    redirect(`/verificar?redirect=${encodeURIComponent("/anuncio/novo")}`);
  }

  // Tudo certo → renderiza sua página atual (client)
  return <>{children}</>;
}
