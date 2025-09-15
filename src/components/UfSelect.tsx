'use client';

import { useMemo } from 'react';

type Props = {
  value: string | null;
  onChange: (v: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  name?: string;
  className?: string;
};

// Lista de UFs (ordenada). Pode mover para um util separado se quiser.
const UF_LIST = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO',
];

export default function UfSelect({
  value,
  onChange,
  disabled,
  placeholder = 'Selecione o estado (UF)',
  id,
  name,
  className,
}: Props) {

  const options = useMemo(() => UF_LIST, []);

  return (
    <div className={className}>
      <label htmlFor={id} className="sr-only">UF</label>
      <select
        id={id}
        name={name}
        value={value ?? ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full rounded-md bg-zinc-900/60 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400/30"
      >
        <option value="">{placeholder}</option>
        {options.map((uf) => (
          <option key={uf} value={uf}>{uf}</option>
        ))}
      </select>
    </div>
  );
}
