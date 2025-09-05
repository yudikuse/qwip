// src/app/anuncio/novo/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionValue } from "@/lib/session";
import ClientPage from "./ClientPage";

// garante execução no server e evita HTML estático
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "default-no-store";

export default async function Page() {
  const jar = await cookies();
  const raw = jar.get("qwip_session")?.value ?? "";
  if (!raw) {
    redirect(`/verificar?redirect=${encodeURIComponent("/anuncio/novo")}`);
  }

  const session = await verifySessionValue(raw);
  const phone = (session as any)?.claims?.phone;
  if (!session.ok || typeof phone !== "string" || phone.length < 5) {
    redirect(`/verificar?redirect=${encodeURIComponent("/anuncio/novo")}`);
  }

  // sessão válida → renderiza o client
  return <ClientPage />;
}
