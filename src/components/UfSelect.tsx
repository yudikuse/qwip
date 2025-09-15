// src/components/UfSelect.tsx
"use client";
const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
export default function UfSelect({ value, onChange, disabled=false }:{
  value?: string; onChange: (v: string)=>void; disabled?: boolean;
}) {
  return (
    <select
      value={value || ""}
      onChange={(e)=>onChange(e.target.value)}
      disabled={disabled}
      className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2"
    >
      <option value="">UF</option>
      {UFS.map((uf)=>(<option key={uf} value={uf}>{uf}</option>))}
    </select>
  );
}
