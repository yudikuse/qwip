// src/app/anuncio/[id]/page.tsx
import Link from "next/link";

type Params = Promise<{ id: string }>;

export default async function Page({ params }: { params: Params }) {
  const { id } = await params;

  // TODO: troque pelo fetch real do anúncio
  // const ad = await getAdById(id);

  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">Anúncio #{id}</h1>

      <div className="rounded-lg border border-white/10 bg-black/30 p-6">
        <p className="text-white/80">
          Conteúdo do anúncio aqui (substituir pelo real).
        </p>
      </div>

      <Link href="/vitrine" className="mt-8 inline-block underline">
        ← Voltar para a Vitrine
      </Link>
    </main>
  );
}
