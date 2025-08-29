// src/app/anuncio/[id]/page.tsx
import Link from "next/link";

type Params = { id: string };

// Normaliza `params`: o Next 15 pode entregar objeto OU Promise<objeto>
async function normalizeParams(
  params?: Params | Promise<Params>
): Promise<Params> {
  if (!params) return { id: "" };
  return await Promise.resolve(params as any);
}

export default async function AnuncioPage(
  props: { params?: Params } | { params?: Promise<Params> }
) {
  const { id } = await normalizeParams((props as any).params);

  // TODO: plugue aqui a busca real do anúncio, ex.:
  // const anuncio = await getAnuncioById(id);

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
          (Placeholder) Troque este bloco para renderizar os dados reais do anúncio.
        </p>
      </div>
    </main>
  );
}
