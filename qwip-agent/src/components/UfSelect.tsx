// src/components/UfSelect.tsx
"use client";

import { useMemo } from "react";

type Props = {
  value: string | null;
  onChange: (uf: string | null) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  placeholder?: string;
};

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC",
  "SP","SE","TO",
];

export default function UfSelect({
  value,
  onChange,
  disabled,
  id = "uf",
  className = "",
  placeholder = "Selecione UF",
}: Props) {
  const hasValue = useMemo(() => !!value, [value]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label htmlFor={id} className="text-sm text-neutral-600 whitespace-nowrap">
        UF
      </label>
      <select
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled}
        className="
          w-28 rounded-lg border border-neutral-300 px-3 py-2
          bg-white/80 backdrop-blur-sm
          text-sm text-neutral-900
          outline-none focus-visible:ring-2 focus-visible:ring-neutral-800
        "
      >
        <option value="">{placeholder}</option>
        {UFS.map((uf) => (
          <option key={uf} value={uf}>
            {uf}
          </option>
        ))}
      </select>
    </div>
  );
}
