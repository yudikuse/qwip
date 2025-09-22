// src/app/auth/phone/page.tsx
import { redirect } from "next/navigation";

// Garante execução por requisição (sem tentativa de SSG que quebra com redirect)
export const dynamic = "force-dynamic";

type SearchParams = { [key: string]: string | string[] | undefined };

export default function AuthPhonePage({ searchParams }: { searchParams: SearchParams }) {
  const rawNext = searchParams?.next;
  const next = Array.isArray(rawNext) ? rawNext[0] : rawNext || "/anunciar";
  redirect(`/verificar-sms?next=${encodeURIComponent(next)}`);
}
