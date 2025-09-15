"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

// ⚠️ IMPORTS — atenção à capitalização dos nomes dos arquivos:
import UfSelect from "@/components/UfSelect";
import CitySelect from "@/components/CitySelect";

type Ad = {
  id: string;
  title: string;
  description: string | null;
  priceCents: number;
  city: string;
  uf: string;
  imageUrl: string | null;
  createdAt: string;
};

// helpers
function formatPrice(cents: number) {
  const v = Math.max(0, Math.trunc(cents || 0));
  const reais = Math.floor(v / 100);
  const cent = (v % 100).toString().padStart(2, "0");
  return `R$ ${reais.toLocaleString("pt-BR")},${cent}`;
}

const ADV_FILTERS = (process.env.NEXT_PUBLIC_ADV_FILTERS ?? "0") === "1";

export default function VitrinePage() {
  const [loading, setLoading] = useState(false);
  const [ads, setAds] = useState<Ad[]>([]);
  const [error, setError] = useState<string | null>(null);

  // filtros
  const [hours, setHours] = useState<number>(24);
  const [uf, setUf] = useState<string>("");
  const [city, setCity] = useState<string>("");

  // quando o gating estiver desligado, ignoramos UF/Cidade
  const effectiveUf = useMemo(() => (ADV_FILTERS ? uf : ""), [uf]);
  const effectiveCity = useMemo(() => (ADV_FILTERS ? city : ""), [city]);

  async function fetchAds() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("hours", String(hours));
      if (effectiveUf) params.set("uf", effectiveUf);
      if (effectiveCity) params.set("city", effectiveCity);

      const res = await fetch(`/api/ads/search?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setAds(Array.isArray(data?.items) ? data.items : []);
    } catch (e: any) {
      setError(e?.message || "Falha ao buscar anúncios");
      setAds([]);
    } finally {
      setLoading(false);
    }
  }

  // primeira carga
  useEffect(() => {
    fetchAds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Vitrine</h1>
          <Link
            href="/criar"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-[#0F1115] hover:bg-emerald-500"
          >
            Criar anúncio
          </Link>
        </div>

        {/* Filtros */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* UF + Cidade aparecem somente se ADV_FILTERS=1 */}
          {ADV_FILTERS ? (
            <>
              <UfSelect
                value={uf}
                onChange={(v) => {
                  setUf(v);
                  setCity(""); // reset cidade ao mudar UF
                }}
              />
              <CitySelect uf={uf} value={city} onChange={setCity} disabled={!uf} />
            </>
          ) : (
            // placeholders “leves” quando filtros avançados estiverem off
            <>
              <input
                className="h-11 rounded-lg border border-white/10 bg-card px-3 text-sm text-zinc-200 placeholder:text-zinc-500"
                placeholder="UF (recurso avançado)"
                disabled
              />
              <input
                className="h-11 rounded-lg border border-white/10 bg-card px-3 text-sm text-zinc-200 placeholder:text-zinc-500"
                placeholder="Cidade (recurso avançado)"
                disabled
              />
            </>
          )}

          {/* Janela de tempo */}
          <div className="flex items-center gap-2">
            <select
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="h-11 w-full rounded-lg border border-white/10 bg-card px-3 text-sm text-zinc-200"
            >
              <option value={24}>Últimas 24h</option>
              <option value={48}>Últimas 48h</option>
              <option value={72}>Últimas 72h</option>
              <option value={168}>Últimos 7 dias</option>
            </select>
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={fetchAds}
            className="h-11 w-full rounded-lg border border-white/10 bg-white/5 text-sm font-semibold hover:bg-white/10 sm:w-auto sm:px-6"
            disabled={loading}
          >
            {loading ? "Filtrando..." : "Filtrar"}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Lista */}
        <div className="grid gap-4">
          {ads.length === 0 && !loading && (
            <div className="rounded-xl border border-white/10 p-6 text-sm text-zinc-400">
              Nenhum anúncio encontrado.
            </div>
          )}

          {ads.map((ad) => (
            <Link
              key={ad.id}
              href={`/anuncio/${ad.id}`}
              className="block overflow-hidden rounded-2xl border border-white/10 bg-card transition hover:border-white/20"
            >
              <div className="relative aspect-[16/9] w-full bg-zinc-900">
                {ad.imageUrl ? (
                  <Image
                    src={ad.imageUrl}
                    alt={ad.title}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 768px, 100vw"
                    // prioridade baixa na lista
                    priority={false}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                    (Sem imagem)
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="text-xs text-zinc-400">
                  {ad.city}
                  {ad.uf ? `, ${ad.uf}` : ""}
                </div>
                <div className="mt-1 text-lg font-semibold">{ad.title}</div>
                <div className="mt-1 text-emerald-400">{formatPrice(ad.priceCents)}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
