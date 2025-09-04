// src/app/anuncio/novo/layout.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionValue } from "@/lib/session";

export default async function NovoAnuncioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Lê a sessão assinada
  const raw = cookies().get("qwip_session")?.value || "";
  const session = await verifySessionValue(raw);

  // Sem sessão válida? Vai para o fluxo de verificação por SMS
  if (!session.ok) {
    redirect(`/verificar?redirect=/anuncio/novo`);
  }

  // Sessão OK → renderiza normalmente o conteúdo da página
  return <>{children}</>;
}
