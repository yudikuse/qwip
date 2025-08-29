// src/app/anuncio/[id]/page.tsx
import Link from "next/link";

type Params = { id: string };

// type guard sem usar `any`
function isPromise<T>(v: unknown): v is Promise<T> {
  return !!v && typeof (v as PromiseLike<T>).then === "function";
}

async function normalizeParams(
  params?: Params | Promise<Params>
): Promise<Params> {
  if (!params) return { id: "" };
  if (isPromise<Params>(params)) return await params;
  return params;
}

export default async function AnuncioPage({
  params,
}: {
  params?: Params | Promise<Params>;
}) {
  const { id } = await normalizeParams(params);

  // TODO: troque por busca real do anúncio (ex.: getAnuncioById(id))
  return (
    <main className="container mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <Link href="/vitrine" className="text-sm text-zinc-400 hover:text-white">
          ← Voltar para a Vitrine
        </Link>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Anúncio #{id}</h1>
        <p className="mt-2 text-zinc-400">
          (Placeholder) Substitua este bloco para renderizar os dados reais do
          anúncio.
        </p>
      </div>
    </main>
  );
}
