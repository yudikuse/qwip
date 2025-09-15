"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

// ✅ Importar com o **case exato** do arquivo:
import UfSelect from "@/components/UfSelect";
import CitySelect from "@/components/CitySelect";

type AdCard = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  city: string | null;
  uf: string | null;
  imageUrl: string | null;
  createdAt: string;
  distance_km?: number | null;
};

function formatPrice(cents: number) {
  const v = Math.max(0, Math.trunc(cents || 0));
  const reais = Math.floor(v / 100);
  const cent = (v % 100).toString().padStart(2, "0");
  return `R$ ${reais.toLocaleString("pt-BR")},${cent}`;
}

// Gating de filtros avançados via env pública
const ADV_FILTERS =
  (process.env.NEXT_PUBLIC_ADV_FILTERS ?? "").toString().trim() === "1";

export default function VitrinePage() {
  // Filtros básicos
  const [q, setQ] = useState("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  // Geo (básico para todos)
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(20);

  // Filtros avançados (gated)
  const [uf, setUf] = useState<string>("");
  const [city, setCity] = useState<string>("");

  // Lista
  const [items, setItems] = useState<AdCard[]>([]);
  const [loading, setLoading] = useState(false);

  // Pega geolocalização apenas 1x ao abrir (para planos simples)
  useEffect(() => {
    if (lat != null && lng != null) return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      () => {
        // silencioso; usuário pode buscar por UF/cidade nos planos business
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, [lat, lng]);

  // Monta query params para /api/ads/search
  const queryString = useMemo(() => {
    const p = new URLSearchParams();

    if (q.trim()) p.set("q", q.trim());

    const min = parseInt(minPrice.replace(/\D/g, "") || "0", 10);
    const max = parseInt(maxPrice.replace(/\D/g, "") || "0", 10);
    if (min > 0) p.set("minPrice", String(min));
    if (max > 0) p.set("maxPrice", String(max));

    // Sempre mandamos geo, se tiver
    if (lat != null && lng != null) {
      p.set("lat", String(lat));
      p.set("lng", String(lng));
      p.set("radiusKm", String(radiusKm || 20));
    }

    // Se filtros avançados estiverem habilitados, também enviamos UF/City
    if (ADV_FILTERS) {
      if (uf) p.set("uf", uf);
      if (city) p.set("city", city);
    }

    // ordenação recente
    p.set("order", "recent");

    return p.toString();
  }, [q, minPrice, maxPrice, lat, lng, radiusKm, uf, city]);

  async function search() {
    setLoading(true);
    try {
      const r = await fetch(`/api/ads/search?${queryString}`, { cache: "no-store" });
      if (!r.ok) throw new Error("Falha ao buscar anúncios");
      const data = await r.json();
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  // Busca inicial
  useEffect(() => {
    // dispara só quando tiver ao menos 1 sinal (geo OU só abre sem geo)
    // para não ficar piscando
    if ((lat != null && lng != null) || !navigator.geolocation) {
      search();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <h1 className="mb-4 text-2xl font-bold">Vitrine</h1>

        {/* Filtros */}
        <div className="mb-5 grid gap-3 rounded-2xl border border-white/10 bg-card p-4 md:grid-cols-12">
          <input
            className="md:col-span-4 rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
            placeholder="Buscar por título ou descrição…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <input
            className="md:col-span-2 rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
            placeholder="Preço mín. (centavos)"
            inputMode="numeric"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <input
            className="md:col-span-2 rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
            placeholder="Preço máx. (centavos)"
            inputMode="numeric"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />

          {/* Geo sempre visível */}
          <div className="md:col-span-2 flex items-center gap-2">
            <label className="text-xs text-zinc-400">Raio (km)</label>
            <input
              type="number"
              min={1}
              max={200}
              className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Math.max(1, Number(e.target.value || 1)))}
              title="Raio de busca em quilômetros"
            />
          </div>

          <button
            className="md:col-span-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-[#0F1115] hover:bg-emerald-500"
            onClick={search}
            disabled={loading}
            title="Buscar"
          >
            {loading ? "Buscando…" : "Buscar"}
          </button>

          {/* Filtros avançados (gated por env) */}
          {ADV_FILTERS && (
            <>
              <div className="md:col-span-2">
                <UfSelect
                  value={uf}
                  onChange={(v) => {
                    setUf(v);
                    setCity(""); // reset cidade quando troca UF
                  }}
                />
              </div>

              <div className="md:col-span-3">
                <CitySelect uf={uf} value={city} onChange={setCity} disabled={!uf} />
              </div>
            </>
          )}
        </div>

        {/* Lista */}
        {items.length === 0 && !loading && (
          <div className="rounded-xl border border-white/10 p-6 text-sm text-zinc-400">
            Nenhum anúncio encontrado para os filtros selecionados.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((ad) => (
            <Link
              key={ad.id}
              href={`/anuncio/${ad.id}`}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-card transition hover:border-emerald-500/40"
              title={ad.title}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-900">
                {ad.imageUrl ? (
                  <Image
                    src={ad.imageUrl}
                    alt={ad.title}
                    fill
                    sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                    (Sem imagem)
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="line-clamp-1 text-sm font-bold">{ad.title}</div>
                <div className="mt-1 text-xs text-zinc-400">
                  {ad.city ?? ""}
                  {ad.uf ? (ad.city ? `, ${ad.uf}` : ad.uf) : ""}
                  {ad.distance_km != null
                    ? ` • ${ad.distance_km.toFixed(1)} km`
                    : ""}
                </div>
                <div className="mt-2 text-base font-semibold">
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
