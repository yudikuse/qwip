// src/components/CookieBanner.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type ConsentMap = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
};

const KEY = "qwip.cookieConsent.v1";

function readStoredConsent(): ConsentMap | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentMap>;
    return {
      necessary: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
    };
  } catch {
    return null;
  }
}

export default function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [consent, setConsent] = useState<ConsentMap>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  // Garante que nada SSR rode com window/localStorage
  useEffect(() => {
    setMounted(true);
    const stored = readStoredConsent();
    if (!stored) {
      setOpen(true);
    } else {
      setConsent(stored);
    }
  }, []);

  const anythingOptionalSelected = useMemo(
    () => consent.analytics || consent.marketing,
    [consent],
  );

  if (!mounted || !open) return null;

  const save = () => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(consent));
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  const acceptAll = () => {
    setConsent({ necessary: true, analytics: true, marketing: true });
    try {
      window.localStorage.setItem(
        KEY,
        JSON.stringify({ necessary: true, analytics: true, marketing: true }),
      );
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  const rejectAll = () => {
    setConsent({ necessary: true, analytics: false, marketing: false });
    try {
      window.localStorage.setItem(
        KEY,
        JSON.stringify({ necessary: true, analytics: false, marketing: false }),
      );
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-5xl px-4 pb-6">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 backdrop-blur p-4 md:p-5 shadow-2xl">
        <div className="md:flex md:items-start md:justify-between md:gap-6">
          <div className="md:max-w-3xl">
            <p className="font-medium">Usamos cookies essenciais.</p>
            <p className="text-sm text-zinc-400 mt-1">
              Para análises e marketing, pedimos seu consentimento.
              Veja nossa{" "}
              <a
                href="/cookies"
                className="underline decoration-zinc-600 hover:text-zinc-200"
              >
                Política de Cookies
              </a>
              ,{" "}
              <a
                href="/privacy"
                className="underline decoration-zinc-600 hover:text-zinc-200"
              >
                Privacidade
              </a>{" "}
              e{" "}
              <a
                href="/terms"
                className="underline decoration-zinc-600 hover:text-zinc-200"
              >
                Termos
              </a>
              .
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-md">
              <label className="flex items-center gap-3 rounded-xl border border-zinc-800 px-3 py-2">
                <input type="checkbox" checked disabled />
                <span className="text-sm">
                  Essenciais <span className="text-zinc-500">(obrigatório)</span>
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-zinc-800 px-3 py-2">
                <input
                  type="checkbox"
                  checked={consent.analytics}
                  onChange={(e) =>
                    setConsent((c) => ({ ...c, analytics: e.target.checked }))
                  }
                />
                <span className="text-sm">Analíticos</span>
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-zinc-800 px-3 py-2 col-span-2">
                <input
                  type="checkbox"
                  checked={consent.marketing}
                  onChange={(e) =>
                    setConsent((c) => ({ ...c, marketing: e.target.checked }))
                  }
                />
                <span className="text-sm">Marketing</span>
              </label>
            </div>
          </div>

          <div className="mt-4 flex shrink-0 items-center gap-2 md:mt-0">
            <button
              type="button"
              onClick={rejectAll}
              className="rounded-xl border border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-800"
            >
              Rejeitar
            </button>
            <button
              type="button"
              onClick={save}
              className="rounded-xl border border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-800 disabled:opacity-60"
              disabled={!anythingOptionalSelected && consent.necessary}
              title={
                !anythingOptionalSelected
                  ? "Você pode salvar mesmo sem analíticos/marketing marcados — use Rejeitar"
                  : "Salvar preferências"
              }
            >
              Salvar preferências
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500"
            >
              Aceitar tudo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
