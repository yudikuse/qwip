// src/app/vitrine/page.tsx
import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";

type Ad = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  city: string;
  uf: string;
  imageUrl: string | null;
  createdAt: string;
  centerLat: number | null;
  centerLng: number | null;
  radiusKm: number | null;
};

function formatPrice(cents: number) {
  const v = Math.max(0, Math.trunc(cents || 0));
  const reais = Math.floor(v / 100);
  const cent = (v % 100).toString().padStart(2, "0");
  return `R$ ${reais.toLocaleString("pt-BR")},${cent}`;
}

async function fetchAds(base: string, qs: string) {
  const r = await fetch(`${base}/api/ads/search${qs}`, { cache: "no-store" });
  if (!r.ok) return { items: [], page: 1, perPage: 12, total: 0 };
  return r.json();
}

export default async function Page(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = `${proto}://${host}`;

  const page = Number(searchParams.page ?? 1) || 1;
  const perPage = Number(searchParams.perPage ?? 12) || 12;

  const uf = (searchParams.uf ?? "") as string;
  const city = (searchParams.city ?? "") as string;
  const hours = (searchParams.hours ?? "24") as string;

  // monta querystring
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("perPage", String(perPage));
  params.set("hours", hours);
  if (uf) params.set("uf", uf);
  if (city) params.set("city", city);

  const data = await fetchAds(base, `?${params.toString()}`);
  const items: Ad[] = data.items ?? [];

  // paginação simples
  const total = Number(data.total ?? 0);
  const lastPage = Math.max(1, Math.ceil(total / perPage));

  function withParam(k: string, v: string) {
    const p = new URLSearchParams(params);
    p.set(k, v);
    return `/vitrine?${p.toString()}`;
    }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Vitrine</h1>
          <Link
            href="/anuncio/novo"
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-[#0F1115] hover:bg-emerald-500"
          >
            Criar anúncio
          </Link>
        </div>

        {/* Filtros básicos inline (sem GeoFormExtras) */}
        <form action="/vitrine" className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            className="rounded-md border border-white/10 bg-card px-3 py-2 text-sm outline-none"
            placeholder="UF (ex: SP)"
            name="uf"
            defaultValue={uf}
          />
          <input
            className="rounded-md border border-white/10 bg-card px-3 py-2 text-sm outline-none"
            placeholder="Cidade"
            name="city"
            defaultValue={city}
          />
          <select
            className="rounded-md border border-white/10 bg-card px-3 py-2 text-sm outline-none"
            name="hours"
            defaultValue={hours}
          >
            <option value="24">Últimas 24h</option>
            <option value="48">Últimas 48h</option>
            <option value="72">Últimas 72h</option>
          </select>
          <button className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10">
            Filtrar
          </button>
        </form>

        {/* Lista */}
        {items.length === 0 ? (
          <div className="rounded-xl border border-white/10 p-6 text-sm text-zinc-400">
            Nenhum anúncio encontrado.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items.map((ad) => (
              <Link
                key={ad.id}
                href={`/anuncio/${ad.id}`}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-card"
              >
                <div className="relative aspect-[4/3] w-full bg-zinc-900">
                  {ad.imageUrl ? (
                    <Image
                      src={ad.imageUrl}
                      alt={ad.title}
                      fill
                      className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                      sizes="(min-width: 1024px) 30vw, 100vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                      (Sem imagem)
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="text-sm text-zinc-400">
                    {ad.city}
                    {ad.uf ? `, ${ad.uf}` : ""}
                  </div>
                  <div className="mt-1 line-clamp-1 text-base font-semibold">{ad.title}</div>
                  <div className="mt-1 text-sm text-emerald-300">
                    {formatPrice(ad.priceCents)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Paginação */}
        <div className="mt-6 flex items-center justify-between text-sm">
          <div>
            Página <strong>{page}</strong> de <strong>{lastPage}</strong> — {total} anúncio(s)
          </div>
          <div className="flex gap-2">
            <Link
              href={withParam("page", String(Math.max(1, page - 1)))}
              className="rounded-md border border-white/10 px-3 py-1.5 hover:bg-white/5"
              aria-disabled={page <= 1}
            >
              Anterior
            </Link>
            <Link
              href={withParam("page", String(Math.min(lastPage, page + 1)))}
              className="rounded-md border border-white/10 px-3 py-1.5 hover:bg-white/5"
              aria-disabled={page >= lastPage}
            >
              Próxima
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
