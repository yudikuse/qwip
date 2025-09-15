'use client';

import { useEffect, useMemo, useState } from 'react';

type Props = {
  uf: string | null;                 // depende da UF
  value: string | null;
  onChange: (v: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  name?: string;
  className?: string;
};

// Fonte simples: você pode trocar depois por uma API/BD.
// Para não pesar no bundle inicial, carregamos sob demanda por UF.
async function fetchCitiesByUf(uf: string): Promise<string[]> {
  // mock leve por enquanto (substitua por fetch real quando tiver endpoint)
  const MAP: Record<string, string[]> = {
    SP: ['São Paulo','Campinas','Santos','São José dos Campos','Ribeirão Preto'],
    RJ: ['Rio de Janeiro','Niterói','Campos dos Goytacazes','Petrópolis'],
    MG: ['Belo Horizonte','Uberlândia','Contagem','Juiz de Fora'],
    PR: ['Curitiba','Londrina','Maringá','Ponta Grossa'],
    RS: ['Porto Alegre','Caxias do Sul','Pelotas','Canoas'],
    // adicione aos poucos; quando ligar à base/endpoint, remova este mock
  };
  return MAP[uf] ?? [];
}

export default function CitySelect({
  uf,
  value,
  onChange,
  disabled,
  placeholder = 'Selecione a cidade',
  id,
  name,
  className,
}: Props) {
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let abort = false;
    (async () => {
      if (!uf) {
        setOptions([]);
        onChange(null);
        return;
      }
      setLoading(true);
      try {
        const cities = await fetchCitiesByUf(uf);
        if (!abort) setOptions(cities);
        // se UF mudou e a cidade anterior não existir mais, limpa:
        if (value && cities.length && !cities.includes(value)) {
          onChange(null);
        }
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, [uf]); // eslint-disable-line react-hooks/exhaustive-deps

  // busca incremental por digitação (nativa do browser com datalist é simples,
  // mas aqui mantemos <select> para consistência visual)
  const [filter, setFilter] = useState('');
  const filtered = useMemo(() => {
    const f = (filter || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
    if (!f) return options;
    return options.filter((c) => (
      c.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().includes(f)
    ));
  }, [options, filter]);

  return (
    <div className={className}>
      <div className="mb-2">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Digite para filtrar cidades"
          disabled={disabled || !uf}
          className="w-full rounded-md bg-zinc-900/60 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400/30"
        />
      </div>

      <label htmlFor={id} className="sr-only">Cidade</label>
      <select
        id={id}
        name={name}
        value={value ?? ''}
        disabled={disabled || !uf || loading}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full max-h-64 overflow-y-auto rounded-md bg-zinc-900/60 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400/30"
      >
        <option value="">
          {uf ? (loading ? 'Carregando cidades…' : placeholder) : 'Selecione a UF primeiro'}
        </option>
        {filtered.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </div>
  );
}
