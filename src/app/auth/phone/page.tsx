// src/app/auth/phone/page.tsx
import { redirect } from "next/navigation";

// Evita SSG e permite redirect no request
export const dynamic = "force-dynamic";

type SearchParams =
  Promise<Record<string, string | string[] | undefined>>;

export default async function AuthPhonePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const rawNext = sp?.next;
  const next = Array.isArray(rawNext) ? rawNext[0] : rawNext || "/anunciar";

  redirect(`/verificar-sms?next=${encodeURIComponent(next)}`);
}
