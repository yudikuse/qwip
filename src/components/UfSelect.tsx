// components/UFSelect.tsx
"use client";

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB",
  "PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

export default function UFSelect({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue ?? ""}
      className="rounded-lg border border-white/10 bg-card p-3 text-sm"
    >
      <option value="">UF (ex: SP)</option>
      {UFS.map((uf) => (
        <option key={uf} value={uf}>
          {uf}
        </option>
      ))}
    </select>
  );
}
