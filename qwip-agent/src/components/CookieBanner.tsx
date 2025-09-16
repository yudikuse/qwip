"use client";

import { useEffect, useState } from "react";

// troque a versão quando quiser “forçar” o banner a aparecer novamente
const CONSENT_KEY = "qwip.cookieConsent.v1";

type Consent = "accepted" | "rejected";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // só roda no client
    try {
      const saved = window.localStorage.getItem(CONSENT_KEY);
      setVisible(!saved); // mostra se não tiver decisão salva
    } catch {
      setVisible(true);
    }
  }, []);

  const save = (value: Consent) => {
    try {
      window.localStorage.setItem(CONSENT_KEY, value);
      // cookie opcional (útil para middleware/CDN)
      document.cookie = `cookieConsent=${value}; Max-Age=${60 * 60 * 24 * 180}; Path=/; SameSite=Lax`;
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] mx-auto mb-4 w-[min(92%,720px)] rounded-xl border border-white/10 bg-[#0B0E12]/95 p-4 text-sm text-zinc-200 shadow-2xl backdrop-blur"
      role="dialog"
      aria-live="polite"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="leading-relaxed">
          Usamos cookies para melhorar sua experiência, medir métricas e lembrar suas preferências.
          Ao clicar em <span className="font-semibold text-emerald-300">Aceitar</span>, você
          concorda com o uso de cookies.
        </p>

        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => save("rejected")}
            className="rounded-md border border-white/15 px-3 py-1.5 text-zinc-200 hover:bg-white/5"
          >
            Continuar só com essenciais
          </button>
          <button
            onClick={() => save("accepted")}
            className="rounded-md bg-emerald-500 px-3 py-1.5 font-medium text-[#0F1115] hover:bg-emerald-400"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
