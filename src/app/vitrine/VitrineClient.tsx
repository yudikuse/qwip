// src/app/vitrine/VitrineClient.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Ad = {
  id: string;
  title: string;
  price: string;
  location: string;
  whatsapp: string;
};

const ADS: Ad[] = [
  { id: "1", title: "Geladeira Brastemp 375L", price: "R$ 1.900", location: "Florianópolis - SC", whatsapp: "5548999999999" },
  { id: "2", title: "Sofá 3 lugares",           price: "R$ 750",   location: "São José - SC",      whatsapp: "5548988888888" },
  { id: "3", title: "Notebook i5 8GB/256GB",    price: "R$ 1.650", location: "Palhoça - SC",       whatsapp: "5548977777777" },
  { id: "4", title: "Bicicleta aro 29",         price: "R$ 890",   location: "Florianópolis - SC", whatsapp: "5548966666666" },
  { id: "5", title: "Cadeira gamer",            price: "R$ 520",   location: "Biguaçu - SC",        whatsapp: "5548955555555" },
  { id: "6", title: "Mesa de jantar 6 cadeiras",price: "R$ 1.200", location: "Florianópolis - SC", whatsapp: "5548944444444" },
];

function waLink(phone: string, title: string) {
  const text = encodeURIComponent(`Olá! Vi "${title}" na Qwip. Ainda está disponível?`);
  return `https://wa.me/${phone}?text=${text}`;
}

function priceToNumber(brazilPrice: string): number {
  const digits = brazilPrice.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}
function toPositiveInt(value: string | null | undefined, fallback: number) {
  const n = value ? parseInt(value, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export default function VitrineClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [q, setQ] = useState("");
  const [location, setLocation] = useState("all");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(6);

  useEffect(() => {
    const qURL = searchParams.get("q") ?? "";
    const locURL = searchParams.get("loc") ?? "all";
    const minURL = searchParams.get("min") ?? "";
    const maxURL = searchParams.get("max") ?? "";
    const pageURL = toPositiveInt(searchParams.get("page"), 1);
    const sizeURL = toPositiveInt(searchParams.get("size"), 6);

    setQ(qURL);
    setLocation(locURL);
    setMin(minURL);
    setMax(maxURL);
    setPage(pageURL);
    setSize(sizeURL);
  }, [searchParams]);

  function pushState(next: Partial<{ q: string; loc: string; min: string; max: string; page: number; size: number }>) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.q !== undefined) params.set("q", next.q);
    if (next.loc !== undefined) params.set("loc", next.loc);
    if (next.min !== undefined) params.set("min", next.min);
    if (next.max !== undefined) params.set("max", next.max);
    if (next.size !== undefined) params.set("size", String(next.size));

    if (next.q !== undefined || next.loc !== undefined || next.min !== undefined || next.max !== undefined || next.size !== undefined) {
      params.set("page", "1");
    } else if (next.page !== undefined) {
      params.set("page", String(next.page));
    }

    ["q","loc","min","max"].forEach((k) => {
      if (!params.get(k) || params.get(k) === "all") params.delete(k);
    });
    if (params.get("size") === "6") params.delete("size");
    if (params.get("page") === "1") params.delete("page");

    router.push(`${pathname}?${params.toString()}`);
  }

  const locations = useMemo(() => Array.from(new Set(ADS.map(a => a.location))), []);
  const filtered = useMemo(() => {
    const minN = min ? parseInt(min, 10) : undefined;
    const maxN = max ? parseInt(max, 10) : undefined;
    return ADS.filter(ad => {
      const matchesQ = !q || ad.title.toLowerCase().includes(q.toLowerCase());
      const matchesLoc = location === "all" || ad.location === location;
      const price = priceToNumber(ad.price);
      const matchesMin = minN === undefined || price >= minN;
      const matchesMax = maxN === undefined || price <= maxN;
      return matchesQ && matchesLoc && matchesMin && matchesMax;
    }).sort((a, b) => priceToNumber(a.price) - priceToNumber(b.price));
  }, [q, location, min, max]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / size));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * size;
  const end = start + size;
  const pageItems = filtered.slice(start, end);

  function clearFilters() {
    setQ(""); setLocation("all"); setMin(""); setMax("");
    pushState({ q: "", loc: "all", min: "", max: "" });
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">Vitrine</h1>

      <div className="rounded-2xl border p-4 mb-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input value={q} onChange={(e) => { setQ(e.target.value); pushState({ q: e.target.value }); }} placeholder="Buscar por título…" className="px-3 py-2 rounded-lg border outline-none" />
          <select value={location} onChange={(e) => { setLocation(e.target.value); pushState({ loc: e.target.value }); }} className="px-3 py-2 rounded-lg border outline-none bg-white">
            <option value="all">Todos os locais</option>
            {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
          </select>
          <input type="number" inputMode="numeric" min={0} value={min} onChange={(e) => { setMin(e.target.value); pushState({ min: e.target.value }); }} placeholder="Preço mín. (R$)" className="px-3 py-2 rounded-lg border outline-none" />
          <input type="number" inputMode="numeric" min={0} value={max} onChange={(e) => { setMax(e.target.value); pushState({ max: e.target.value }); }} placeholder="Preço máx. (R$)" className="px-3 py-2 rounded-lg border outline-none" />
          <div className="flex gap-2">
            <select value={size} onChange={(e) => { const v = toPositiveInt(e.target.value, 6); setSize(v); pushState({ size: v }); }} className="px-3 py-2 rounded-lg border outline-none bg-white" title="Itens por página">
              {[6,9,12,18].map(v => <option key={v} value={v}>{v}/página</option>)}
            </select>
            <button onClick={clearFilters} className="px-3 py-2 rounded-lg border hover:bg-gray-50">Limpar</button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-3">
          {filtered.length === 0
            ? "Nenhum resultado."
            : `${Math.min(start + 1, filtered.length)}–${Math.min(end, filtered.length)} de ${filtered.length} resultado${filtered.length > 1 ? "s" : ""}.`}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {pageItems.map((ad) => (
          <div key={ad.id} className="rounded-2xl border p-4 shadow-sm hover:shadow-md transition">
            <h3 className="text-lg font-semibold">{ad.title}</h3>
            <p className="text-gray-600 mt-1">{ad.location}</p>
            <p className="text-xl font-bold mt-3">{ad.price}</p>
            <div className="mt-4 flex gap-2">
              <a href={waLink(ad.whatsapp, ad.title)} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg border hover:bg-gray-50">
                Chamar no WhatsApp
              </a>
            </div>
          </div>
        ))}
      </div>

      {pageCount > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button className="px-3 py-2 rounded-lg border disabled:opacity-40" disabled={currentPage <= 1} onClick={() => pushState({ page: currentPage - 1 })}>
            ← Anterior
          </button>
          {Array.from({ length: pageCount }).map((_, i) => {
            const n = i + 1;
            const active = n === currentPage;
            return (
              <button key={n} onClick={() => pushState({ page: n })} className={`px-3 py-2 rounded-lg border ${active ? "bg-black text-white" : "hover:bg-gray-50"}`} aria-current={active ? "page" : undefined}>
                {n}
              </button>
            );
          })}
          <button className="px-3 py-2 rounded-lg border disabled:opacity-40" disabled={currentPage >= pageCount} onClick={() => pushState({ page: currentPage + 1 })}>
            Próxima →
          </button>
        </div>
      )}

      <div className="mt-10">
        <Link href="/" className="text-sm underline">← Voltar para a Home</Link>
      </div>
    </main>
  );
}
