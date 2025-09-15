// app/vitrine/page.tsx
import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import UFSelect from "@/components/UFSelect";
import CitySelect from "@/components/CitySelect";

type AdListItem = {
  id: string;
  title: string;
  priceCents: number;
  city: string;
  uf: string;
  imageUrl: string | null;
  createdAt: string;
};

function fmtPrice(cents: number) {
  const v = Math.max(0, Math.trunc(cents || 0));
  const reais = Math.floor(v / 100);
  const cent = (v % 100).toString().padStart(2, "0");
  return `R$ ${reais.toLocaleString("pt-BR")},${cent}`;
}

async function fetchAds(base: string, qs: string): Promise<AdListItem[]> {
  const r = await fetch(`${base}/api/ads/search${qs}`, { cache: "no-store" });
  if (!r.ok) return [];
  const data = await r.json();
  return (data?.items ?? []) as AdListItem[];
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = `${proto}://${host}`;

  const sp = new URLSearchParams(Object.entries(await (searchParams ?? {})).flatMap(([k, v]) =>
    v == null ? [] : Array.isArray(v) ? v.map((x) => [k, x]) : [[k, v]]
  ));
  // default últimas 24h
  if (!sp.has("hours")) sp.set("hours", "24");

  const items = await fetchAds(base, `?${sp.toString()}`);

  const ufSel = sp.get("uf") ?? "";
  const citySel = sp.get("city") ?? "";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-4xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Vitrine</h1>
          <Link
            href="/criar"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-[#0F1115] hover:bg-emerald-500"
          >
            Criar anúncio
          </Link>
        </div>

        {/* Filtros */}
        <form className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <UFSelect name="uf" defaultValue={ufSel} />
          <CitySelect name="city" uf={ufSel} defaultValue={citySel} />
          <select
            name="hours"
            defaultValue={sp.get("hours") ?? "24"}
            className="col-span-1 rounded-lg border border-white/10 bg-card p-3 text-sm sm:col-span-2"
          >
            <option value="24">Últimas 24h</option>
            <option value="72">Últimas 72h</option>
            <option value="168">Últimos 7 dias</option>
          </select>

          <button className="col-span-1 rounded-lg border border-white/10 bg-card p-3 text-sm hover:bg-white/5 sm:col-span-2">
            Filtrar
          </button>
        </form>

        {/* Lista */}
        <div className="space-y-4">
          {items.map((ad) => (
            <Link
              key={ad.id}
              href={`/anuncio/${ad.id}`}
              className="block overflow-hidden rounded-2xl border border-white/10 bg-card"
            >
              <div className="relative aspect-[4/3] w-full bg-zinc-900">
                {ad.imageUrl ? (
                  <Image
                    src={ad.imageUrl}
                    alt={ad.title}
                    fill
                    className="object-cover"
                    sizes="(min-width:768px) 640px, 100vw"
                    priority
                  />
                ) : null}
              </div>
              <div className="p-4">
                <div className="text-sm text-zinc-400">
                  {ad.city}
                  {ad.uf ? `, ${ad.uf}` : ""}
                </div>
                <div className="mt-1 text-lg font-semibold">{ad.title}</div>
                <div className="mt-1 text-emerald-400">{fmtPrice(ad.priceCents)}</div>
              </div>
            </Link>
          ))}
          {items.length === 0 && (
            <div className="rounded-xl border border-white/10 p-6 text-sm text-zinc-400">
              Nenhum anúncio encontrado nesse filtro.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
