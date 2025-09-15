"use client";

import { useEffect, useState } from "react";

type City = { id: number; nome: string };

export default function CitySelect(props: {
  uf: string;
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const { uf, value, onChange, placeholder = "Cidade", disabled } = props;
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!uf) {
        setCities([]);
        return;
      }
      try {
        setLoading(true);
        const r = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`
        );
        const data: City[] = await r.json();
        if (active) setCities(data.sort((a, b) => a.nome.localeCompare(b.nome)));
      } catch (e) {
        console.error("Falha ao carregar cidades do IBGE", e);
        if (active) setCities([]);
      } finally {
        active && setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [uf]);

  return (
    <select
      value={value}
      disabled={disabled || !uf || loading}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
    >
      <option value="">
        {loading ? "Carregando..." : placeholder}
      </option>
      {cities.map((c) => (
        <option key={c.id} value={c.nome}>
          {c.nome}
        </option>
      ))}
    </select>
  );
}
