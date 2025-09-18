// src/components/ExpiryTimer.tsx
"use client";

import { useEffect, useState } from "react";

/**
 * Exibe uma contagem regressiva para a data de expiração.
 * Quando não houver expiresAt ou já tiver passado, não mostra nada.
 */
export default function ExpiryTimer({ expiresAt }: { expiresAt: string | null | undefined }) {
  if (!expiresAt) return null;

  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    const expiryDate = new Date(expiresAt);
    if (isNaN(expiryDate.getTime())) {
      setTimeLeft(null);
      return;
    }

    const updateTimeLeft = () => {
      const now = new Date();
      const diffMs = expiryDate.getTime() - now.getTime();
      if (diffMs <= 0) {
        setTimeLeft(null);
        return;
      }
      const totalSeconds = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const parts: string[] = [];
      if (days > 0) parts.push(`${days}d`);
      parts.push(`${hours}h`);
      parts.push(`${minutes}m`);
      setTimeLeft(parts.join(" "));
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60 * 1000); // atualiza a cada minuto
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!timeLeft) return null;
  return (
    <div className="inline-block rounded-md bg-yellow-500/10 px-3 py-1 text-sm font-semibold text-yellow-500 dark:text-yellow-400">
      Oferta expira em {timeLeft}
    </div>
  );
}
