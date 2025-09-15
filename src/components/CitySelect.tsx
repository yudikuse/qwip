"use client";

import { useEffect, useState } from "react";

type Props = {
  uf: string;                 // usa a UF selecionada
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

type City = { nome: string };

export default function CitySelect({
  uf,
  value,
  onChange,
  placeholder = "Cidade",
  disabled,
  className = "",
}: Props) {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!uf) {
      setCities([]);
      return;
    }
    let abort = false;
    setLoading(true);
    // API oficial do IBGE (lista municípios por UF)
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`)
      .then((r) => r.json())
      .then((data) => {
        if (!abort) setCities(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!abort) setCities([]);
      })
      .finally(() => !abort && setLoading(false));
    return () => {
      abort = true;
    };
  }, [uf]);

  const isDisabled = disabled || !uf || loading;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={isDisabled}
      className={`w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm outline-none placeholder:text-zinc-500 ${className}`}
    >
      <option value="">{loading ? "Carregando..." : placeholder}</option>
      {cities.map((c) => (
        <option key={c.nome} value={c.nome}>
          {c.nome}
        </option>
      ))}
    </select>
  );
}

