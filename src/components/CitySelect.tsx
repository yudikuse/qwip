"use client";

import { useEffect, useMemo, useState } from "react";

const cache = new Map<string, string[]>();

type Props = {
  uf?: string;
  value?: string;
  onChange: (city: string) => void;
  placeholder?: string;
  className?: string;
};

export default function CitySelect({ uf, value, onChange, placeholder = "Cidade", className }: Props) {
  const [list, setList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancel = false;
    async function load() {
      if (!uf) {
        setList([]);
        return;
      }
      const key = uf.toUpperCase();
      if (cache.has(key)) {
        setList(cache.get(key)!);
        return;
      }
      setLoading(true);
      try {
        const r = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${key}/municipios`);
        const data = (await r.json()) as Array<{ nome: string }>;
        const cities = data.map((d) => d.nome).sort((a, b) => a.localeCompare(b, "pt-BR"));
        cache.set(key, cities);
        if (!cancel) setList(cities);
      } catch {
        if (!cancel) setList([]);
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    load();
    return () => {
      cancel = true;
    };
  }, [uf]);

  const disabled = !uf || loading;

  const options = useMemo(() => {
    if (!uf) return [];
    return list;
  }, [list, uf]);

  return (
    <select
      disabled={disabled}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className={className ?? "w-full rounded-lg bg-[#0F1115] border border-white/10 px-3 py-2 text-sm disabled:opacity-60"}
    >
      <option value="">{loading ? "Carregando..." : placeholder}</option>
      {options.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  );
}
