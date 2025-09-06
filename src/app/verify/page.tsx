import { redirect } from "next/navigation";

// Allow both synchronous and asynchronous searchParams types
export default async function Page(props: any) {
  const raw =
    props?.searchParams && typeof props.searchParams.then === "function"
      ? await props.searchParams
      : props?.searchParams ?? {};

  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (Array.isArray(value)) {
      value.forEach((v) => qs.append(key, String(v)));
    } else if (value !== undefined && value !== null) {
      qs.set(key, String(value));
    }
  }

  redirect(`/verificar${qs.toString() ? `?${qs.toString()}` : ""}`);
}
