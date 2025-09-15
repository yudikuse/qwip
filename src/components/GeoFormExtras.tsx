// src/components/GeoFormExtras.tsx
"use client";

import { useRef, useState } from "react";

export default function GeoFormExtras({
  initialLat = "",
  initialLng = "",
}: { initialLat?: string; initialLng?: string }) {
  const latRef = useRef<HTMLInputElement>(null);
  const lngRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>("");

  const fillGeo = () => {
    if (!("geolocation" in navigator)) {
      setErr("Seu navegador não suporta geolocalização.");
      return;
    }
    setBusy(true);
    setErr("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        const { latitude, longitude } = pos.coords;
        if (latRef.current) latRef.current.value = String(latitude);
        if (lngRef.current) lngRef.current.value = String(longitude);
      },
      (e) => {
        setBusy(false);
        setErr(e?.message || "Falha ao obter localização.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="mt-3">
      <input type="hidden" name="lat" defaultValue={initialLat} ref={latRef} />
      <input type="hidden" name="lng" defaultValue={initialLng} ref={lngRef} />
      <button
        type="button"
        onClick={fillGeo}
        disabled={busy}
        className="rounded-md border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5 disabled:opacity-50"
      >
        {busy ? "Obtendo localização..." : "Usar minha localização"}
      </button>
      {err ? <div className="mt-1 text-xs text-red-400">{err}</div> : null}
      <div className="mt-1 text-[11px] text-zinc-500">
        Se latitude/longitude estiverem presentes com um <b>raio</b>, aplicamos filtro geográfico.
      </div>
    </div>
  );
}
