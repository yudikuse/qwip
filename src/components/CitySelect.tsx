"use client";

import { useEffect, useMemo, useState } from "react";

type City = { id: number; nome: string };

export default function CitySelect(props: {
  uf: string;                  // UF selecionada (ex: "SP"). Se vazio, o select fica desabilitado.
  value: string;               // Nome da cidade atual (mesmo texto que aparece nas opções)
  onChange: (city: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const { uf, value, onChange, placeholder = "Cidade", disabled } = props;

  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(""); // para filtrar por digitação

  // Carrega cidades do IBGE ao mudar a UF
  useEffect(() => {
    let abort = false;

    async function load() {
      if (!uf) {
        setCities([]);
        return;
      }
      try {
        setLoading(true);
        // API oficial do IBGE
        const url = `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`;
        const resp = await fetch(url, { cache: "force-cache" });
        if (!resp.ok) throw new Error("Falha ao carregar cidades");
        const data: Array<{ id: number; nome: string }> = await resp.json();
        if (!abort) setCities(data);
      } catch {
        if (!abort) setCities([]);
      } finally {
        if (!abort) setLoading(false);
      }
    }

    load();
    return () => {
      abort = true;
    };
  }, [uf]);

  // Filtro leve no cliente para UX melhor (rola lista + você pode digitar para filtrar)
  const filtered = useMemo(() => {
    if (!query.trim()) return cities;
    const q = query.trim().toLowerCase();
    return cities.filter((c) => c.nome.toLowerCase().includes(q));
  }, [cities, query]);

  const isDisabled = disabled || !uf || loading;

  return (
    <div className="w-full">
      <input
        type="text"
        inputMode="search"
        placeholder={uf ? "Digite para filtrar cidades..." : placeholder}
        value={value ? value : query}
        onChange={(e) => {
          // Se já tem uma cidade escolhida e o usuário começa a digitar, limpamos o value
          if (value) {
            onChange("");
          }
          setQuery(e.target.value);
        }}
        disabled={!uf || disabled}
        className="mb-2 w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
      />

      <select
        value={value}
        disabled={isDisabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
      >
        <option value="">
          {uf
            ? loading
              ? "Carregando cidades..."
              : filtered.length
              ? "Selecione a cidade"
              : "Nenhuma cidade encontrada"
            : placeholder}
        </option>

        {filtered.map((c) => (
          <option key={c.id} value={c.nome}>
            {c.nome}
          </option>
        ))}
      </select>
    </div>
  );
}
