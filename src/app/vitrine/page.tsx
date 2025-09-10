// src/app/vitrine/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Ad = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  city: string;
  uf: string;
  price: number;
  createdAt: string;
  expiresAt: string;
};

type ListResponse = {
  ok: boolean;
  page: number;
  pageSize: number;
  total: number;
  items: (Ad & { priceCents?: number })[];
};

const UF_LIST = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB",
  "PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

export default function VitrinePage() {
  const [items, setItems] = useState<Ad[]>([]);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(12);
  const [total, setTotal] = useState<number>(0);

  const [uf, setUF] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [lat, setLat] = useState<number | "">("");
  const [lng, setLng] = useState<number | "">("");
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const fetchList = async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("pageSize", String(pageSize));
    if (uf) qs.set("uf", uf);
    if (city) qs.set("city", city);
    if (lat !== "" && lng !== "") {
      qs.set("lat", String(lat));
      qs.set("lng", String(lng));
      if (radiusKm > 0) qs.set("radiusKm", String(radiusKm));
    }

    const r = await fetch(`/api/ads?${qs.toString()}`, { cache: "no-store" });
    const data: ListResponse = await r.json();
    setLoading(false);

    if (data?.ok) {
      setItems(data.items);
      setTotal(data.total);
    } else {
      setItems([]);
      setTotal(0);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, uf, city, lat, lng, radiusKm]);

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      () => {}
    );
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Vitrine (últimas 24h)</h1>
          <Link
            href="/anuncio/novo"
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5"
          >
            + Criar anúncio
          </Link>
        </div>

        {/* Filtros */}
        <section className="mb-6 rounded-2xl border border-white/10 bg-card p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="block text-xs text-zinc-400">UF</label>
              <select
                value={uf}
                onChange={(e) => { setUF(e.target.value); setPage(1); }}
                className="mt-1 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none"
              >
                <option value="">Todas</option>
                {UF_LIST.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs text-zinc-400">Cidade</label>
              <input
                value={city}
                onChange={(e) => { setCity(e.target.value); setPage(1); }}
                placeholder="Ex.: Campinas"
                className="mt-1 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400">Raio (km)</label>
              <input
                type="range"
                min={1}
                max={50}
                value={radiusKm}
                onChange={(e) => setRadiusKm(parseInt(e.target.value, 10))}
                className="w-full"
              />
              <div className="mt-1 text-xs text-zinc-500">{radiusKm} km</div>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={useMyLocation}
                className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-[#0F1115] hover:bg-emerald-500"
              >
                Usar minha localização
              </button>
              {(lat !== "" && lng !== "") && (
                <button
                  onClick={() => { setLat(""); setLng(""); }}
                  className="whitespace-nowrap rounded-md border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
                  title="Limpar localização"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Lista */}
        <section className="rounded-2xl border border-white/10 bg-card p-4">
          {loading ? (
            <div className="p-6 text-sm text-zinc-400">Carregando anúncios...</div>
          ) : items.length === 0 ? (
            <div className="p-6 text-sm text-zinc-400">Nenhum anúncio encontrado.</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((ad) => (
                <Link
                  key={ad.id}
                  href={`/anuncio/${ad.id}`}
                  className="overflow-hidden rounded-xl border border-white/10 bg-[#0B0E12] hover:border-emerald-500/40"
                >
                  <div className="h-44 w-full bg-zinc-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ad.imageUrl} alt={ad.title} className="h-44 w-full object-cover" />
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-semibold line-clamp-1">{ad.title}</div>
                    <div className="mt-1 text-xs text-zinc-400">
                      {ad.city}{ad.uf ? `, ${ad.uf}` : ""}
                    </div>
                    <div className="mt-1 text-xs text-zinc-300 font-medium">
                      R$ {ad.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="mt-2 inline-flex items-center rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-300 ring-1 ring-amber-400/20">
                      expira em 24h
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-md border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5 disabled:opacity-50"
              >
                Anterior
              </button>
              <div className="text-xs text-zinc-400">
                Página <span className="text-zinc-200">{page}</span> / {totalPages}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-md border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5 disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
