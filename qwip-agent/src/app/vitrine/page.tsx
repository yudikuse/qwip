// src/app/vitrine/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
};

const ADV = process.env.NEXT_PUBLIC_ADV_FILTERS === "1";

export default function VitrinePage() {
  const [loading, setLoading] = useState(false);
  const [ads, setAds] = useState<AdCard[]>([]);

  // filtros
  const [q, setQ] = useState("");
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [uf, setUf] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    // geo básico: apenas radiusKm (o backend usa a localStorage geo ou ignora se não houver)
    if (radiusKm) p.set("radiusKm", String(radiusKm));
    // filtros avançados (ligados apenas quando ADV = 1)
    if (ADV && uf) p.set("uf", uf);
    if (ADV && city) p.set("city", city);
    p.set("limit", "30");
    return p.toString();
  }, [q, radiusKm, uf, city]);

  useEffect(() => {
    let aborted = false;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/ads/search?${qs}`, { cache: "no-store" });
        if (!r.ok) throw new Error("search failed");
        const data = await r.json();
        if (!aborted) setAds(data?.items ?? []);
      } catch {
        if (!aborted) setAds([]);
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [qs]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-card p-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-zinc-400">Palavra-chave</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="O que está procurando?"
              className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-400">Raio (km)</label>
            <input
              type="number"
              min={1}
              max={100}
              value={radiusKm}
              onChange={(e) => setRadiusKm(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
              className="w-28 rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {ADV && (
            <>
              <div className="w-36">
                <label className="mb-1 block text-xs text-zinc-400">UF</label>
                <UfSelect value={uf} onChange={setUf} />
              </div>
              <div className="w-56">
                <label className="mb-1 block text-xs text-zinc-400">Cidade</label>
                <CitySelect uf={uf} value={city} onChange={setCity} />
              </div>
            </>
          )}
        </div>

        <div className="mb-3 text-sm text-zinc-400">
          {loading ? "Carregando…" : `Encontrados: ${ads.length}`}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ads.map((ad) => (
            <Link
              key={ad.id}
              href={`/anuncio/${ad.id}`}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-card"
            >
              <div className="aspect-[4/3] w-full bg-zinc-900">
                {ad.imageUrl ? (
                  // Next/Image aqui é opcional; se preferir:
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ad.imageUrl}
                    alt={ad.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                    (Sem imagem)
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="line-clamp-1 text-sm font-semibold">{ad.title}</div>
                <div className="mt-1 line-clamp-2 text-xs text-zinc-400">{ad.description}</div>
                {(ad.city || ad.uf) && (
                  <div className="mt-1 text-[11px] text-zinc-500">
                    {ad.city ?? ""}{ad.city && ad.uf ? ", " : ""}{ad.uf ?? ""}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
