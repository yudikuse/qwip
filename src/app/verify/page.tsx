import { redirect } from "next/navigation";

// Não tipamos o parâmetro para evitar conflito com o PageProps do seu template.
export default async function Page(props: any) {
  // Suporta as duas formas: objeto direto ou Promise
  const raw =
    props?.searchParams && typeof props.searchParams.then === "function"
      ? await props.searchParams
      : props?.searchParams ?? {};

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(raw)) {
    if (Array.isArray(v)) {
      for (const val of v) qs.append(k, String(val));
    } else if (v !== undefined && v !== null) {
      qs.set(k, String(v));
    }
  }

  redirect(`/verificar${qs.toString() ? `?${qs.toString()}` : ""}`);
}
