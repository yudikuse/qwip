"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Ad = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  city: string;
  uf: string;
  imageUrl: string | null;
  createdAt: string;
};

const UF_LIST = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB",
  "PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const HOURS_OPTIONS = [
  { label: "Últimas 24h", value: 24 },
  { label: "Últimas 48h", value: 48 },
  { label: "Últimos 7 dias", value: 24 * 7 },
];

function formatPrice(cents: number) {
  const v = Math.max(0, Math.trunc(cents || 0));
  const reais = Math.floor(v / 100);
  const cent = (v % 100).toString().padStart(2, "0");
  return `R$ ${reais.toLocaleString("pt-BR")},${cent}`;
}

type Query = {
  uf?: string;
  city?: string;
  hours?: number;
  page?: number;
  pageSize?: number;
};

async function fetchAds(q: Query) {
  const params = new URLSearchParams();
  if (q.uf) params.set("uf", q.uf);
  if (q.city) params.set("city", q.city);
  if (q.hours) params.set("hours", String(q.hours));
  if (q.page) params.set("page", String(q.page));
  if (q.pageSize) params.set("pageSize", String(q.pageSize));

  const url = `/api/ads/search?${params.toString()}`;
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error("Falha ao buscar anúncios");
  // Esperado: { items: Ad[], total: number, nextPage: number | null, cities?: string[] }
  return r.json() as Promise<{
    items: Ad[];
    total: number;
    nextPage: number | null;
    cities?: string[];
  }>;
}

export default function VitrinePage() {
  // filtros
  const [uf, setUf] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [hours, setHours] = useState<number>(24);

  // dados
  const [items, setItems] = useState<Ad[]>([]);
  const [nextPage, setNextPage] = useState<number | null>(1);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // cidades sugeridas (datalist); quando a rota passar a suportar, pode vir do backend
  const [suggestedCities, setSuggestedCities] = useState<string[]>([]);

  const pageSize = 10;

  const queryBase = useMemo<Query>(() => {
    return {
      uf: uf || undefined,
      city: city || undefined,
      hours,
      pageSize,
    };
  }, [uf, city, hours]);

  async function runSearch(reset = true) {
    try {
      setError("");
      setLoading(true);
      const firstPage = reset ? 1 : nextPage ?? 1;

      const data = await fetchAds({ ...queryBase, page: firstPage });

      setItems((prev) => (reset ? data.items : [...prev, ...data.items]));
      setNextPage(data.nextPage);
      setTotal(data.total);

      // tentativa de ajudar a cidade (quando a API começar a mandar)
      if (Array.isArray(data.cities) && data.cities.length) {
        setSuggestedCities(data.cities);
      } else if (reset) {
        // limpa sugestões quando filtro muda
        setSuggestedCities([]);
      }
    } catch (e: any) {
      setError(e?.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  // primeira carga
  useEffect(() => {
    runSearch(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // quando filtros mudarem e usuário clicar em "Filtrar"
  function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault();
    setNextPage(1);
    runSearch(true);
  }

  function handleLoadMore() {
    if (!nextPage || loading) return;
    runSearch(false);
  }

  function shareAd(ad: Ad) {
    const url = `${window.location.origin}/anuncio/${ad.id}`;
    const text = `${ad.title} - ${formatPrice(ad.priceCents)}\n${url}`;
    if (navigator.share) {
      navigator
        .share({ title: ad.title, text, url })
        .catch(() => {/* ignore cancel */});
    } else {
      navigator.clipboard?.writeText(text).catch(() => {});
      alert("Link copiado!");
    }
  }

  function whatsappAd(ad: Ad) {
    const url = `${window.location.origin}/anuncio/${ad.id}`;
    const text = `${ad.title} - ${formatPrice(ad.priceCents)}\n${url}`;
    const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(wa, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-4xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Vitrine</h1>
          <Link
            href="/criar"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-[#0F1115] hover:bg-emerald-500"
          >
            Criar anúncio
          </Link>
        </div>

        {/* Filtros */}
        <form onSubmit={handleApplyFilters} className="mb-4 grid gap-3 sm:grid-cols-2">
          {/* UF */}
          <select
            aria-label="UF"
            value={uf}
            onChange={(e) => {
              setUf(e.target.value);
              setCity(""); // reset cidade quando trocar UF
            }}
            className="w-full rounded-lg border border-white/10 bg-card px-3 py-2 text-sm outline-none"
          >
            <option value="">UF (ex: SP)</option>
            {UF_LIST.map((sigla) => (
              <option key={sigla} value={sigla}>
                {sigla}
              </option>
            ))}
          </select>

          {/* Cidade (com datalist pra rolagem/auto-completar) */}
          <div>
            <input
              list="cities"
              aria-label="Cidade"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Cidade"
              disabled={!uf} // só habilita quando tiver UF
              className="w-full rounded-lg border border-white/10 bg-card px-3 py-2 text-sm outline-none disabled:opacity-50"
            />
            <datalist id="cities">
              {suggestedCities.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          {/* Janela de tempo */}
          <select
            aria-label="Janela de tempo"
            value={hours}
            onChange={(e) => setHours(parseInt(e.target.value, 10))}
            className="w-full rounded-lg border border-white/10 bg-card px-3 py-2 text-sm outline-none sm:col-span-2"
          >
            {HOURS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10 sm:col-span-2"
          >
            {loading ? "Filtrando..." : "Filtrar"}
          </button>
        </form>

        {/* Estado da busca */}
        {!!error && (
          <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Cards */}
        <div className="grid gap-4">
          {items.map((ad) => (
            <article
              key={ad.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-card"
            >
              <Link href={`/anuncio/${ad.id}`} className="block">
                <div className="relative aspect-[4/3] w-full bg-zinc-900">
                  {ad.imageUrl ? (
                    <Image
                      src={ad.imageUrl}
                      alt={ad.title}
                      fill
                      className="object-cover"
                      sizes="(min-width: 768px) 720px, 100vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                      (Sem imagem)
                    </div>
                  )}
                </div>
              </Link>

              <div className="p-4">
                <div className="text-xs text-zinc-400">
                  {ad.city}
                  {ad.uf ? `, ${ad.uf}` : ""}
                </div>
                <Link href={`/anuncio/${ad.id}`} className="mt-1 block text-lg font-semibold">
                  {ad.title}
                </Link>
                <div className="mt-1 text-emerald-400">{formatPrice(ad.priceCents)}</div>

                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => whatsappAd(ad)}
                    className="flex-1 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-[#0F1115] hover:bg-emerald-500"
                  >
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => shareAd(ad)}
                    className="flex-1 rounded-md border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
                  >
                    Compartilhar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Paginação */}
        <div className="mt-6 flex items-center justify-center">
          {nextPage ? (
            <button
              type="button"
              disabled={loading}
              onClick={handleLoadMore}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
            >
              {loading ? "Carregando..." : "Carregar mais"}
            </button>
          ) : (
            <div className="text-sm text-zinc-400">
              {items.length === 0 ? "Nenhum anúncio encontrado." : "Fim da lista."}
            </div>
          )}
        </div>

        {/* Rodapé com contagem */}
        <div className="mt-3 text-center text-xs text-zinc-500">
          {items.length} de {total} anúncio(s)
        </div>
      </div>
    </main>
  );
}
