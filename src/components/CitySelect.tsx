// components/CitySelect.tsx
"use client";

import { useEffect, useState } from "react";

type City = { id: number; nome: string };

export default function CitySelect({
  name,
  uf,
  defaultValue,
}: {
  name: string;
  uf?: string;
  defaultValue?: string;
}) {
  const [cities, setCities] = useState<City[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!uf) {
        setCities(null);
        return;
      }
      try {
        const r = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`
        );
        const data = (await r.json()) as City[];
        if (alive) setCities(data);
      } catch {
        if (alive) setCities([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [uf]);

  const disabled = !uf;

  return (
    <select
      name={name}
      defaultValue={defaultValue ?? ""}
      disabled={disabled}
      className="rounded-lg border border-white/10 bg-card p-3 text-sm disabled:opacity-50"
    >
      <option value="">{disabled ? "Selecione uma UF" : "Cidade"}</option>
      {(cities ?? []).map((c) => (
        <option key={c.id} value={c.nome}>
          {c.nome}
        </option>
      ))}
    </select>
  );
}
