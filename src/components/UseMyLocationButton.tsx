// src/components/UseMyLocationButton.tsx
"use client";

import { useState } from "react";
import { getPrecisePosition } from "@/lib/geo";

export type UseMyLocationButtonProps = {
  className?: string;
  onLocate: (p: { lat: number; lng: number; accuracy?: number }) => void;
};

export default function UseMyLocationButton({ className, onLocate }: UseMyLocationButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const p = await getPrecisePosition({ timeoutMs: 12000 });
      // Alerta amigável se a precisão estiver ruim (ex.: fallback por IP)
      if ((p.accuracy ?? 999999) > 1500) {
        console.warn("[geo] precisão baixa (provável IP). accuracy(m):", p.accuracy);
        alert("Não consegui obter sua posição precisa. Se puder, informe seu CEP para melhorar a localização.");
      }
      onLocate(p);
    } catch (e: any) {
      console.error("[geo] erro ao obter posição", e);
      alert("Não foi possível obter sua localização. Informe seu CEP.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className={className ?? "px-3 py-2 rounded-md bg-emerald-700 hover:bg-emerald-600 text-white"}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? "Obtendo localização..." : "Usar minha localização"}
    </button>
  );
}
