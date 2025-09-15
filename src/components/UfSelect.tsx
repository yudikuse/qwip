"use client";

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
] as const;

type Props = {
  value?: string;
  onChange: (uf: string) => void;
  placeholder?: string;
  className?: string;
};

export default function UFSelect({ value, onChange, placeholder = "UF (ex: SP)", className }: Props) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className={className ?? "w-full rounded-lg bg-[#0F1115] border border-white/10 px-3 py-2 text-sm"}
    >
      <option value="">{placeholder}</option>
      {UFS.map((uf) => (
        <option key={uf} value={uf}>
          {uf}
        </option>
      ))}
    </select>
  );
}
