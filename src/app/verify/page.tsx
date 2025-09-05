// src/app/verify/page.tsx
import { redirect } from "next/navigation";

type SP = Record<string, string | string[] | undefined>;

/**
 * Alguns templates do Next 15 tipam `searchParams` como Promise.
 * Fazemos a função async e "resolvemos" os params antes de redirecionar.
 */
export default async function Page(
  props: { searchParams?: Promise<SP> } | { searchParams?: SP }
) {
  const raw =
    "searchParams" in props
      ? (typeof (props as any).searchParams?.then === "function"
          ? await (props as { searchParams?: Promise<SP> }).searchParams
          : (props as { searchParams?: SP }).searchParams) ?? {}
      : {};

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(raw)) {
    if (Array.isArray(v)) v.forEach((val) => qs.append(k, String(val)));
    else if (v !== undefined) qs.set(k, String(v));
  }

  redirect(`/verificar${qs.toString() ? `?${qs.toString()}` : ""}`);
}
