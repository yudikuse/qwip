// src/app/vitrine/page.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Ad = {
  id: string;
  title: string;
  price: string;      // ex: "R$ 1.900"
  location: string;   // ex: "Florianópolis - SC"
  whatsapp: string;   // E.164 ex: 5548999999999
};

const ADS: Ad[] = [
  { id: "1", title: "Geladeira Brastemp 375L", price: "R$ 1.900", location: "Florianópolis - SC", whatsapp: "5548999999999" },
  { id: "2", title: "Sofá 3 lugares",           price: "R$ 750",    location: "São José - SC",     whatsapp: "5548988888888" },
  { id: "3", title: "Notebook i5 8GB/256GB",    price: "R$ 1.650",  location: "Palhoça - SC",      whatsapp: "5548977777777" },
  { id: "4", title: "Bicicleta aro 29",         price: "R$ 890",    location: "Florianópolis - SC", whatsapp: "5548966666666" },
  { id: "5", title: "Cadeira gamer",            price: "R$ 520",    location: "Biguaçu - SC",       whatsapp: "5548955555555" },
  { id: "6", title: "Mesa de jantar 6 cadeiras",price: "R$ 1.200",  location: "Florianópolis - SC", whatsapp: "5548944444444" },
];

function waLink(phone: string, title: string) {
  const text = encodeURIComponent(`Olá! Vi "${title}" na Qwip. Ainda está disponível?`);
  return `https://wa.me/${phone}?text=${text}`;
}

// Converte "R$ 1.900" -> 1900 (número em reais)
function priceToNumber(brazilPrice: string): number {
  const digits = brazilPrice.replace(/[^\d]/g, ""); // remove tudo menos dígitos
  return digits ? parseInt(digits, 10) : 0;
}

export default function VitrinePage() {
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("all");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  const locations = useMemo(() => {
    return Array.from(new Set(ADS.map(a => a.location)));
  }, []);

  const filtered = useMemo(() => {
    const minN = min ? parseInt(min, 10) : undefined;
    const maxN = max ? parseInt(max, 10) : undefined;

    return ADS.filter(ad => {
      const matchesQ =
        !q ||
        ad.title.toLowerCase().includes(q.toLowerCase());

      const matchesLoc =
        location === "all" || ad.location === location;

      const price = priceToNumber(ad.price);
      const matchesMin = minN === undefined || price >= minN;
      const matchesMax = maxN === undefined || price <= maxN;

      return matchesQ && matchesLoc && matchesMin && matchesMax;
    }).sort((a, b) => priceToNumber(a.price) - priceToNumber(b.price));
  }, [q, location, min, max]);

  function clearFilters() {
    setQ("");
    setLocation("all");
    setMin("");
    setMax("");
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">
        Vitrine
      </h1>

      {/* Filtros */}
      <div className="rounded-2xl border p-4 mb-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título…"
            className="px-3 py-2 rounded-lg border outline-none"
          />
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="px-3 py-2 rounded-lg border outline-none bg-white"
          >
            <option value="all">Todos os locais</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={min}
            onChange={(e) => setMin(e.target.value)}
            placeholder="Preço mín. (R$)"
            className="px-3 py-2 rounded-lg border outline-none"
          />
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={max}
              onChange={(e) => setMax(e.target.value)}
              placeholder="Preço máx. (R$)"
              className="px-3 py-2 rounded-lg border outline-none flex-1"
            />
            <button
              onClick={clearFilters}
              className="px-3 py-2 rounded-lg border hover:bg-gray-50"
            >
              Limpar
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-600 mt-3">
          {filtered.length} resultado{filtered.length === 1 ? "" : "s"} encontrado
          {filtered.length === 1 ? "" : "s"}.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((ad) => (
          <div key={ad.id} className="rounded-2xl border p-4 shadow-sm hover:shadow-md transition">
            <h3 className="text-lg font-semibold">{ad.title}</h3>
            <p className="text-gray-600 mt-1">{ad.location}</p>
            <p className="text-xl font-bold mt-3">{ad.price}</p>

            <div className="mt-4 flex gap-2">
              <a
                href={waLink(ad.whatsapp, ad.title)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg border hover:bg-gray-50"
              >
                Chamar no WhatsApp
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <Link href="/" className="text-sm underline">
          ← Voltar para a Home
        </Link>
      </div>
    </main>
  );
}

