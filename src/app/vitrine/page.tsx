// src/app/vitrine/page.tsx
import Image from "next/image";
import Link from "next/link";

// ====== Tipos ======
type Ad = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  city: string;
  uf: string | null;
  imageUrl: string | null;
  createdAt: string; // ISO
};

// ====== Utils ======
function formatPrice(cents: number) {
  const v = Math.max(0, Math.trunc(cents || 0));
  const reais = Math.floor(v / 100);
  const cent = (v % 100).toString().padStart(2, "0");
  return `R$ ${reais.toLocaleString("pt-BR")},${cent}`;
}

function humanSince(since: string | undefined) {
  switch (since) {
    case "24h":
      return "Últimas 24h";
    case "7d":
      return "Últimos 7 dias";
    case "30d":
      return "Últimos 30 dias";
    default:
      return "Qualquer data";
  }
}

// ====== Filtro (client) ======
function AdvancedEnabled() {
  // Substituído em build pelo Next (não roda no server apenas)
  return process.env.NEXT_PUBLIC_ADV_FILTERS === "1";
}

// Componente client isolado para poder usar onChange etc.
function FilterBar({
  initialUf,
  initialCity,
  initialSince,
}: {
  initialUf?: string;
  initialCity?: string;
  initialSince?: string;
}) {
  "use client";

  // Importa **minúsculo** para bater com nome do arquivo (ufselect.tsx)
  // Se você renomear o arquivo para UFSelect.tsx, troque o import aqui também.
  const UFSelect =
    AdvancedEnabled() ? require("@/components/ufselect").default : null;

  // Fallback leve para cidade. Quando criar `cityselect.tsx`,
  // basta trocar por: const CitySelect = require("@/components/cityselect").default
  const CityInput = ({
    uf,
    defaultValue,
  }: {
    uf?: string;
    defaultValue?: string;
  }) => (
    <input
      name="city"
      autoComplete="off"
      defaultValue={defaultValue ?? ""}
      placeholder={uf ? "Cidade (filtra dentro da UF)" : "Cidade"}
      className="w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-emerald-600/60"
    />
  );

  return (
    <form
      method="GET"
      className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[160px_1fr_160px_120px]"
    >
      {AdvancedEnabled() ? (
        <>
          {/* UF */}
          <div className="w-full">
            {UFSelect ? (
              <UFSelect name="uf" defaultValue={initialUf ?? ""} />
            ) : (
              <input
                name="uf"
                defaultValue={initialUf ?? ""}
                placeholder="UF (ex: SP)"
                className="w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-emerald-600/60"
              />
            )}
          </div>

          {/* Cidade (dependente da UF – por enquanto input leve) */}
          <CityInput uf={initialUf} defaultValue={initialCity} />

          {/* Período */}
          <select
            name="since"
            defaultValue={initialSince ?? "24h"}
            className="w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600/60"
          >
            <option value="24h">Últimas 24h</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="all">Qualquer data</option>
          </select>

          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-[#0F1115] hover:bg-emerald-500"
          >
            Filtrar
          </button>
        </>
      ) : (
        // Modo básico (sem filtros avançados)
        <>
          <div className="col-span-full text-sm text-zinc-400">
            Filtros avançados indisponíveis no seu plano.
          </div>
        </>
      )}
    </form>
  );
}

// ====== Server Component (página) ======
export default async function Page({
  searchParams,
}: {
  searchParams?: {
    uf?: string;
    city?: string;
    since?: "24h" | "7d" | "30d" | "all";
  };
}) {
  const uf = searchParams?.uf?.toUpperCase() || "";
  const city = searchParams?.city?.trim() || "";
  const since = searchParams?.since || "24h";

  // Monta query string para a API de busca
  const qs = new URLSearchParams();
  if (uf) qs.set("uf", uf);
  if (city) qs.set("city", city);
  if (since) qs.set("since", since);

  // Busca na API interna (sem cache para refletir rápido)
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/ads/search?${qs}`, {
    cache: "no-store",
  }).catch(() => null);

  const data = (await res?.json().catch(() => null)) as
    | { items: Ad[] }
    | null;

  const items: Ad[] = data?.items ?? [];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Vitrine</h1>
          <Link
            href="/criar"
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-[#0F1115] hover:bg-emerald-500"
          >
            Criar anúncio
          </Link>
        </div>

        {/* Barra de filtros (client) */}
        <FilterBar
          initialUf={uf}
          initialCity={city}
          initialSince={since}
        />

        {/* Resumo do filtro */}
        {AdvancedEnabled() && (
          <div className="mb-3 text-xs text-zinc-400">
            Filtro:{" "}
            {uf ? `UF ${uf}` : "qualquer UF"}
            {city ? `, cidade ${city}` : ""}
            {", " + humanSince(since)}
          </div>
        )}

        {/* Lista */}
        <div className="grid gap-4">
          {items.length === 0 && (
            <div className="rounded-xl border border-white/10 p-6 text-sm text-zinc-400">
              Nenhum anúncio encontrado.
            </div>
          )}

          {items.map((ad) => (
            <Link
              key={ad.id}
              href={`/anuncio/${ad.id}`}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-card"
            >
              <div className="relative aspect-[16/9] w-full bg-zinc-900">
                {ad.imageUrl ? (
                  <Image
                    src={ad.imageUrl}
                    alt={ad.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    sizes="(min-width:1024px) 900px, 100vw"
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
                <div className="mt-1 text-lg font-semibold">{ad.title}</div>
                <div className="mt-1 text-emerald-400">
                  {formatPrice(ad.priceCents)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
