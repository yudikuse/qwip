// src/app/anuncio/novo/layout.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionValue } from "@/lib/session";

export default async function NovoAnuncioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Lê a sessão assinada do cookie HttpOnly
  const jar = await cookies(); // <- importante no Next 15
  const raw = jar.get("qwip_session")?.value || "";
  const session = await verifySessionValue(raw);

  // Sem sessão válida? Envia para o fluxo de verificação por SMS
  if (!session.ok) {
    redirect(`/verificar?redirect=/anuncio/novo`);
  }

  // Sessão OK → renderiza a página normalmente
  return <>{children}</>;
}
