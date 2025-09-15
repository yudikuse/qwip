// src/app/vitrine/page.tsx
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import GeoFormExtras from "@/components/GeoFormExtras";

type AdLite = {
  id: string;
  title: string;
  priceCents: number;
  city: string;
  uf: string;
  imageUrl: string | null;
  createdAt: string;
};

function formatPrice(cents: number) {
  const v = Math.max(0, Math.trunc(cents || 0));
  const reais = Math.floor(v / 100);
  const cent = (v % 100).toString().padStart(2, "0");
  return `R$ ${reais.toLocaleString("pt-BR")},${cent}`;
}

async function fetchList(base: string, qs: URLSearchParams) {
  const r = await fetch(`${base}/api/ads/search?${qs.toString()}`, { cache: "no-store" });
  if (!r.ok) throw new Error("Falha ao buscar anúncios");
  return r.json() as Promise<{
    ok: boolean;
    page: number;
    pageSize: number;
    total: number;
    items: AdLite[];
  }>;
}

export default async function Page(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Next 15: searchParams é Promise
  const spRaw = await props.searchParams;

  const page = Math.max(1, parseInt(String(spRaw.page ?? "1"), 10) || 1);
  const pageSize = Math.max(1, Math.min(30, parseInt(String(spRaw.pageSize ?? "12"), 10) || 12));

  const uf = String(spRaw.uf ?? "").toUpperCase().slice(0, 2);
  const city = String(spRaw.city ?? "");
  const lat = String(spRaw.lat ?? "");
  const lng = String(spRaw.lng ?? "");
  const radiusKm = String(spRaw.radiusKm ?? "");

  // monta base
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = `${proto}://${host}`;

  // QS pra API
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("pageSize", String(pageSize));
  if (uf) qs.set("uf", uf);
  if (city) qs.set("city", city);
  if (lat) qs.set("lat", lat);
  if (lng) qs.set("lng", lng);
  if (radiusKm) qs.set("radiusKm", radiusKm);

  const data = await fetchList(base, qs);

  const totalPages = Math.max(1, Math.ceil((data.total || 0) / data.pageSize));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  // helpers de navegação
  const mkHref = (p: number) => {
    const next = new URLSearchParams(qs);
    next.set("page", String(p));
    return `/vitrine?${next.toString()}`;
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Vitrine</h1>
          <Link
            href="/anuncio/novo"
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-[#0F1115] hover:bg-emerald-500"
          >
            Criar anúncio
          </Link>
        </div>

        {/* Filtros */}
        <form action="/vitrine" method="get" className="mb-6 rounded-2xl border border-white/10 bg-card p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400">UF</label>
              <input
                name="uf"
                defaultValue={uf}
                placeholder="SP"
                maxLength={2}
                className="mt-1 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-500 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400">Cidade</label>
              <input
                name="city"
                defaultValue={city}
                placeholder="São Paulo"
                className="mt-1 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400">Raio (km)</label>
              <input
                name="radiusKm"
                type="number"
                min={1}
                max={50}
                step={1}
                defaultValue={radiusKm || ""}
                placeholder="ex.: 10"
                className="mt-1 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-500"
              />
            </div>
          </div>

          {/* extras client-side: lat/lng via geolocalização */}
          <GeoFormExtras initialLat={lat} initialLng={lng} />

          <div className="mt-3 flex items-center gap-3">
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-[#0F1115] hover:bg-emerald-500"
            >
              Filtrar
            </button>
            <Link
              href="/vitrine"
              className="rounded-md border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
            >
              Limpar
            </Link>
          </div>
        </form>

        {/* Lista */}
        {data.items.length === 0 ? (
          <div className="rounded-xl border border-white/10 p-6 text-sm text-zinc-400">
            Nenhum anúncio encontrado nas últimas 24h para os filtros informados.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((ad) => (
              <Link
                key={ad.id}
                href={`/anuncio/${ad.id}`}
                className="overflow-hidden rounded-xl border border-white/10 bg-card transition hover:border-white/20"
              >
                <div className="relative aspect-[4/3] w-full bg-zinc-900">
                  {ad.imageUrl ? (
                    <Image
                      src={ad.imageUrl}
                      alt={ad.title}
                      fill
                      className="object-cover"
                      sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 100vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                      (Sem imagem)
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="line-clamp-1 text-sm font-semibold">{ad.title}</div>
                  <div className="mt-1 text-xs text-zinc-400">
                    {ad.city}{ad.uf ? `, ${ad.uf}` : ""}
                  </div>
                  <div className="mt-2 text-sm font-bold">{formatPrice(ad.priceCents)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Paginação */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-xs text-zinc-400">
            Página <span className="font-semibold text-zinc-200">{page}</span> de{" "}
            <span className="font-semibold text-zinc-200">{totalPages}</span> •{" "}
            <span className="font-semibold text-zinc-200">{data.total}</span> anúncios
          </div>

          <div className="flex gap-2">
            <Link
              href={hasPrev ? mkHref(page - 1) : "#"}
              aria-disabled={!hasPrev}
              className={`rounded-md border border-white/10 px-3 py-1.5 text-sm ${
                hasPrev ? "hover:bg-white/5" : "pointer-events-none opacity-50"
              }`}
            >
              ← Anterior
            </Link>
            <Link
              href={hasNext ? mkHref(page + 1) : "#"}
              aria-disabled={!hasNext}
              className={`rounded-md border border-white/10 px-3 py-1.5 text-sm ${
                hasNext ? "hover:bg-white/5" : "pointer-events-none opacity-50"
              }`}
            >
              Próxima →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
