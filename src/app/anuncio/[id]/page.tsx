// src/app/anuncio/[id]/page.tsx
import Link from "next/link";

export default async function AnuncioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // TODO: trocar por fetch real do anúncio com o id
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
          (Placeholder) Renderize aqui os dados reais do anúncio buscados pelo
          ID.
        </p>
      </div>
    </main>
  );
}
