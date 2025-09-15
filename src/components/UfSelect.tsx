// src/components/UfSelect.tsx
"use client";

import { useMemo } from "react";

type Props = {
  value: string | null;
  onChange: (uf: string | null) => void;
  disabled?: boolean;
  className?: string;
};

// Lista fixa das UFs (ordem alfabética)
const UF_LIST = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA",
  "MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN",
  "RO","RR","RS","SC","SE","SP","TO",
];

export default function UfSelect({ value, onChange, disabled, className }: Props) {
  const options = useMemo(() => UF_LIST, []);

  return (
    <select
      className={className ?? "w-full rounded-md border border-white/10 bg-[#0F1115] px-3 py-2 text-sm"}
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value ? e.target.value : null)}
    >
      <option value="">Estado (UF)</option>
      {options.map((uf) => (
        <option key={uf} value={uf}>
          {uf}
        </option>
      ))}
    </select>
  );
}
