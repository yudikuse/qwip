// src/components/CookieBanner.tsx
"use client";

import { useEffect, useState } from "react";

type Prefs = {
  necessary: true;          // sempre ligado
  analytics: boolean;       // alternável
  marketing: boolean;       // opcional (já deixo aqui para futuro)
};

const COOKIE_NAME = "qwip_cc";
const COOKIE_MAX_AGE_DAYS = 180;

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days: number) {
  if (typeof document === "undefined") return;
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

export default function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [managing, setManaging] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // se já existe cookie, não abre
    const raw = getCookie(COOKIE_NAME);
    if (!raw) {
      setOpen(true);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Prefs;
      // validação simples
      if (typeof parsed.analytics === "boolean") {
        setPrefs({ necessary: true, analytics: parsed.analytics, marketing: !!parsed.marketing });
        setOpen(false);
      } else {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, []);

  function persist(next: Prefs) {
    setPrefs(next);
    setCookie(COOKIE_NAME, JSON.stringify(next), COOKIE_MAX_AGE_DAYS);
  }

  function acceptAll() {
    persist({ necessary: true, analytics: true, marketing: true });
    setOpen(false);
  }

  function onlyEssential() {
    persist({ necessary: true, analytics: false, marketing: false });
    setOpen(false);
  }

  function saveManaged() {
    persist(prefs);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-5 sm:px-6 sm:pb-6"
    >
      <div className="w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900/90 shadow-2xl backdrop-blur">
        <div className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6 sm:p-6">
          <div>
            <h3 className="text-base font-medium text-zinc-100">
              Cookies no Qwip
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Usamos cookies essenciais para o funcionamento do site e, com seu
              consentimento, cookies analíticos para melhorar a experiência.
              Veja nossa{" "}
              <a href="/privacy" className="text-emerald-400 underline">
                Política de Privacidade
              </a>
              .
            </p>

            {/* Gerenciamento avançado */}
            {managing && (
              <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">
                      Essenciais (sempre ativos)
                    </p>
                    <p className="text-xs text-zinc-400">
                      Necessários para funcionalidades básicas e segurança.
                    </p>
                  </div>
                  <span className="select-none rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                    ON
                  </span>
                </div>

                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">
                      Analíticos
                    </p>
                    <p className="text-xs text-zinc-400">
                      Nos ajudam a entender uso e melhorar o produto (sem
                      publicidade).
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-pressed={prefs.analytics}
                    onClick={() =>
                      setPrefs((p) => ({ ...p, analytics: !p.analytics }))
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      prefs.analytics ? "bg-emerald-500/80" : "bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                        prefs.analytics ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="mt-4 flex items-start justify-between gap-4 opacity-60">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">
                      Marketing (não utilizado)
                    </p>
                    <p className="text-xs text-zinc-400">
                      Reservado para futuras integrações. Mantemos desativado.
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-pressed={prefs.marketing}
                    onClick={() =>
                      setPrefs((p) => ({ ...p, marketing: !p.marketing }))
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      prefs.marketing ? "bg-emerald-500/80" : "bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                        prefs.marketing ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    onClick={saveManaged}
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                  >
                    Salvar preferências
                  </button>
                  <button
                    onClick={() => setManaging(false)}
                    className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800"
                  >
                    Voltar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Ações rápidas */}
          {!managing && (
            <div className="flex flex-col gap-3 sm:w-64">
              <button
                onClick={acceptAll}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-500"
              >
                Aceitar tudo
              </button>
              <button
                onClick={onlyEssential}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-4 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800"
              >
                Apenas essenciais
              </button>
              <button
                onClick={() => setManaging(true)}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-800/70 px-4 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800"
              >
                Gerenciar cookies
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
