// src/app/verify/page.tsx
import { redirect } from "next/navigation";

export default function Page({ searchParams }: { searchParams?: Record<string, string> }) {
  const qs = new URLSearchParams(searchParams || {}).toString();
  redirect(`/verificar${qs ? `?${qs}` : ""}`);
}
