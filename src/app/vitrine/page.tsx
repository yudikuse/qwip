// src/app/vitrine/page.tsx
import Link from "next/link";
import { headers } from "next/headers";
import UfSelect from "@/components/UfSelect";
import CitySelect from "@/components/CitySelect";

type Item = {
  id: string;
  title: string;
  priceCents: number;
  city: string | null;
  uf: string | null;
  imageUrl: string | null;
};

function formatPrice(cents: number) {
  const v = Math.max(0, Math.trunc(cents || 0));
  const reais = Math.floor(v / 100);
  const cent = (v % 100).toString().padStart(2, "0");
  return `R$ ${reais.toLocaleString("pt-BR")},${cent}`;
}

async function search(base: string, params: URLSearchParams) {
  const r = await fetch(`${base}/api/ads/search?${params.toString()}`, { cache: "no-store" });
  if (!r.ok) return { items: [], total: 0 };
  return r.json();
}

export default async function Page() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = `${proto}://${host}`;

  // server-side first load (sem filtros pra começar)
  const data = await search(base, new URLSearchParams());

  // flag de gating: “1” libera UF/Cidade; qualquer outra coisa esconde
  const advanced = process.env.NEXT_PUBLIC_ADV_FILTERS === "1";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Vitrine</h1>
          <Link
            href="/anunciar"
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-[#0F1115] hover:bg-emerald-500"
          >
            Criar anúncio
          </Link>
        </div>

        {/* Filtros */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {advanced ? (
            <>
              {/* UF */}
              {/* Você pode hidratar com Client Components se quiser controlar no client. Aqui mostramos o UI. */}
              <UfSelect value={null} onChange={() => {}} />
              {/* Cidade depende da UF; no SSR deixamos desabilitado; no client você conecta com estado. */}
              <CitySelect uf={null} value={null} onChange={() => {}} />
            </>
          ) : (
            <div className="text-sm text-zinc-400">
              Filtro por localização automática (geolocalização) ativo no plano atual.
            </div>
          )}
        </div>

        {/* Lista */}
        {data.items.length === 0 ? (
          <div className="rounded-xl border border-white/10 p-6 text-sm text-zinc-400">
            Nenhum anúncio encontrado.
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((ad: Item) => (
              <li key={ad.id} className="overflow-hidden rounded-xl border border-white/10 bg-card">
                <Link href={`/anuncio/${ad.id}`} className="block">
                  <div className="aspect-[4/3] w-full bg-zinc-900">
                    {/* pode trocar por next/image depois que tiver domínio liberado */}
                    {ad.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ad.imageUrl} alt={ad.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                        (Sem imagem)
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="truncate text-sm font-semibold">{ad.title}</div>
                    <div className="mt-1 text-xs text-zinc-400">
                      {ad.city ?? "-"}{ad.uf ? `, ${ad.uf}` : ""}
                    </div>
                    <div className="mt-2 text-sm font-bold">{formatPrice(ad.priceCents)}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
