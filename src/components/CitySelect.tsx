// src/components/CitySelect.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  uf: string | null;
  value: string | null;
  onChange: (city: string | null) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  placeholder?: string;
};

export default function CitySelect({
  uf,
  value,
  onChange,
  disabled,
  id = "city",
  className = "",
  placeholder = "Cidade",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<string[]>([]);

  // carrega cidades quando UF muda
  useEffect(() => {
    let cancel = false;

    async function load() {
      if (!uf) {
        setCities([]);
        return;
      }
      setLoading(true);
      try {
        // Se você tiver esse endpoint pronto, ótimo:
        // /api/geo/cities?uf=SP  -> ["São Paulo","Campinas", ...]
        const res = await fetch(`/api/geo/cities?uf=${encodeURIComponent(uf)}`, {
          cache: "force-cache",
        });
        if (res.ok) {
          const data = (await res.json()) as string[];
          if (!cancel) setCities(data);
        } else {
          if (!cancel) setCities([]);
        }
      } catch {
        if (!cancel) setCities([]);
      } finally {
        if (!cancel) setLoading(false);
      }
    }

    load();
    return () => {
      cancel = true;
    };
  }, [uf]);

  const listId = useMemo(() => `${id}-list`, [id]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label htmlFor={id} className="text-sm text-neutral-600 whitespace-nowrap">
        Cidade
      </label>

      <input
        id={id}
        list={listId}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={!uf || disabled}
        placeholder={loading ? "Carregando..." : placeholder}
        className="
          w-56 rounded-lg border border-neutral-300 px-3 py-2
          bg-white/80 backdrop-blur-sm
          text-sm text-neutral-900
          outline-none focus-visible:ring-2 focus-visible:ring-neutral-800
        "
      />

      <datalist id={listId}>
        {cities.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </div>
  );
}
