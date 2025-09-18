"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  /** ISO string, ex.: "2025-09-18T18:00:00.000Z" */
  expiresAt?: string | null;
  className?: string;
  /** Dispara 1x quando expirar */
  onExpired?: () => void;
  /** Texto antes do tempo, ex.: "Expira em" */
  prefix?: string;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function ExpiryTimer({
  expiresAt,
  className,
  onExpired,
  prefix = "Expira em",
}: Props) {
  // ✅ Hooks sempre no topo e na mesma ordem
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const expiresAtMs = useMemo(() => {
    const ms = expiresAt ? Date.parse(expiresAt) : NaN;
    return Number.isFinite(ms) ? ms : NaN;
  }, [expiresAt]);

  const { remainMs, label } = useMemo(() => {
    if (!Number.isFinite(expiresAtMs)) return { remainMs: NaN, label: "" };
    const ms = Math.max(0, expiresAtMs - now);
    const totalSec = Math.floor(ms / 1000);
    const hh = Math.floor(totalSec / 3600);
    const mm = Math.floor((totalSec % 3600) / 60);
    const ss = totalSec % 60;
    const lbl = hh > 0 ? `${pad(hh)}:${pad(mm)}:${pad(ss)}` : `${pad(mm)}:${pad(ss)}`;
    return { remainMs: ms, label: lbl };
  }, [expiresAtMs, now]);

  // Dispara callback quando expirar
  useEffect(() => {
    if (Number.isFinite(expiresAtMs) && expiresAtMs - now <= 0) {
      onExpired?.();
    }
  }, [expiresAtMs, now, onExpired]);

  // Sem data válida -> não renderiza (hooks já foram chamados)
  if (!Number.isFinite(expiresAtMs)) return null;

  const isExpired = remainMs <= 0;

  return (
    <div className={className}>
      {isExpired ? (
        <span className="inline-flex items-center rounded-md bg-red-500/10 px-2 py-1 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-500/20">
          Expirado
        </span>
      ) : (
        <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-400 ring-1 ring-inset ring-amber-500/20">
          {prefix} {label}
        </span>
      )}
    </div>
  );
}
