// src/components/CitySelect.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  uf: string | null;                // depende da UF
  value: string | null;
  onChange: (city: string | null) => void;
  disabled?: boolean;
  className?: string;
};

// Para não depender de API externa agora, deixei um dicionário mínimo.
// Você pode expandir depois (ou trocar por fetch de uma API de cidades).
const CITIES_BY_UF: Record<string, string[]> = {
  SP: ["São Paulo","Campinas","Guarulhos","Santos","São Bernardo do Campo","Santo André","Osasco","Ribeirão Preto","Sorocaba","São José dos Campos"],
  RJ: ["Rio de Janeiro","Niterói","Duque de Caxias","Nova Iguaçu","Campos dos Goytacazes","Volta Redonda"],
  MG: ["Belo Horizonte","Uberlândia","Juiz de Fora","Contagem","Betim","Uberaba"],
  PR: ["Curitiba","Londrina","Maringá","Ponta Grossa","Cascavel","São José dos Pinhais"],
  RS: ["Porto Alegre","Caxias do Sul","Pelotas","Canoas","Santa Maria","Gravataí"],
  // ...adicione conforme precisar
};

export default function CitySelect({ uf, value, onChange, disabled, className }: Props) {
  const [query, setQuery] = useState("");

  const all = useMemo(() => (uf ? CITIES_BY_UF[uf] ?? [] : []), [uf]);

  // Filtra por prefixo enquanto digita (leve e convencional)
  const filtered = useMemo(() => {
    if (!query) return all;
    const q = query.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
    return all.filter((c) =>
      c
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .startsWith(q)
    );
  }, [all, query]);

  // Se trocar de UF e a cidade atual não existir nessa UF, limpa
  useEffect(() => {
    if (value && uf && !(CITIES_BY_UF[uf] ?? []).includes(value)) onChange(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uf]);

  return (
    <div className={className ?? "w-full"}>
      <input
        type="text"
        placeholder={uf ? "Digite a cidade..." : "Selecione a UF primeiro"}
        disabled={!uf || disabled}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-2 w-full rounded-md border border-white/10 bg-[#0F1115] px-3 py-2 text-sm"
      />
      <select
        disabled={!uf || disabled}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? e.target.value : null)}
        className="w-full rounded-md border border-white/10 bg-[#0F1115] px-3 py-2 text-sm"
        size={Math.min(8, Math.max(3, filtered.length || 3))} // lista com rolagem leve
      >
        <option value="">{uf ? "Cidade" : "Selecione a UF"}</option>
        {filtered.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}
