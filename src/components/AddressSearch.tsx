// src/components/AddressSearch.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Picked = { lat: number; lng: number; city?: string; uf?: string };

const STATE_TO_UF: Record<string, string> = {
  Acre: "AC", Alagoas: "AL", Amapá: "AP", Amazonas: "AM",
  Bahia: "BA", Ceará: "CE", "Distrito Federal": "DF", "Espírito Santo": "ES",
  Goiás: "GO", Maranhão: "MA", "Mato Grosso": "MT", "Mato Grosso do Sul": "MS",
  "Minas Gerais": "MG", Pará: "PA", Paraíba: "PB", Paraná: "PR",
  Pernambuco: "PE", Piauí: "PI", "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN",
  "Rio Grande do Sul": "RS", Rondônia: "RO", Roraima: "RR", "Santa Catarina": "SC",
  "São Paulo": "SP", Sergipe: "SE", Tocantins: "TO",
};

type Item = {
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
};

export default function AddressSearch({
  onPick,
  placeholder = "Digite endereço, bairro, cidade…",
  className,
}: {
  onPick: (p: Picked) => void;
  placeholder?: string;
  className?: string;
}) {
  const [q, setQ] = useState("");
  const [list, setList] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  // fecha dropdown ao clicar fora
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // debounce
  const debouncedQ = useDebounce(q, 400);

  useEffect(() => {
    (async () => {
      const term = (debouncedQ || "").trim();
      if (term.length < 3) {
        setList([]);
        return;
      }
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&countrycodes=br&q=${encodeURIComponent(
          term
        )}`;
        const r = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
        if (!r.ok) return;
        const data = (await r.json()) as Item[];
        setList(data || []);
        setOpen(true);
      } catch {
        // silencia
      }
    })();
  }, [debouncedQ]);

  function pick(it: Item) {
    const lat = parseFloat(it.lat);
    const lng = parseFloat(it.lon);
    let city: string | undefined;
    let uf: string | undefined;

    const a = it.address || {};
    city = a.city || a.town || a.village || a.suburb || undefined;

    const iso =
      a["ISO3166-2-lvl4"] || a["ISO3166-2-lvl3"] || a["ISO3166-2-lvl2"] || "";
    if (typeof iso === "string" && iso.startsWith("BR-")) {
      uf = iso.slice(3);
    } else if (a.state && STATE_TO_UF[a.state]) {
      uf = STATE_TO_UF[a.state];
    }

    onPick({ lat, lng, city, uf });
    setOpen(false);
  }

  return (
    <div ref={boxRef} className={className ?? ""}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => q.trim().length >= 3 && setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-500"
      />
      {open && list.length > 0 && (
        <div className="mt-1 max-h-64 w-full overflow-auto rounded-md border border-white/10 bg-[#11141a] shadow-lg">
          {list.map((it, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => pick(it)}
              className="block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-white/5"
            >
              {it.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function useDebounce<T>(value: T, ms = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
