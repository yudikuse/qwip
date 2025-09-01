'use client';

import { useEffect, useState } from 'react';

type Consent = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
};

const COOKIE_NAME = 'qwip_consent';
const MAX_AGE = 60 * 60 * 24 * 180; // 180 dias

function readConsent(): Consent | null {
  const match = document.cookie.split('; ').find(c => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match.split('=')[1])) as Consent;
  } catch {
    return null;
  }
}

function writeConsent(c: Consent) {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(
    JSON.stringify(c)
  )}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax`;
  // avisa o app para (des)carregar scripts
  window.dispatchEvent(new Event('qwip-consent-changed'));
}

declare global {
  interface Window {
    qwipOpenCookieBanner?: () => void;
  }
}

export default function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const c = readConsent();
    if (!c) setOpen(true);

    // função global para reabrir pelo botão “Gerenciar cookies”
    window.qwipOpenCookieBanner = () => {
      const current = readConsent();
      setAnalytics(!!current?.analytics);
      setMarketing(!!current?.marketing);
      setOpen(true);
    };

    return () => {
      delete window.qwipOpenCookieBanner;
    };
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto mb-4 max-w-5xl rounded-2xl border border-neutral-800 bg-neutral-900/95 p-4 shadow-xl backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-neutral-200">
            Usamos <strong>cookies essenciais</strong> e, com seu consentimento,
            <strong> analíticos</strong> e <strong>marketing</strong>. Saiba mais em{' '}
            <a href="/cookies" className="underline">Cookies</a>,{' '}
            <a href="/privacy" className="underline">Privacidade</a> e{' '}
            <a href="/terms" className="underline">Termos</a>.
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="flex items-center gap-4 rounded-xl bg-neutral-800/60 px-3 py-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                />
                Analíticos
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                />
                Marketing
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  writeConsent({ essential: true, analytics: false, marketing: false });
                  setOpen(false);
                }}
                className="rounded-xl border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-800"
              >
                Rejeitar
              </button>

              <button
                onClick={() => {
                  writeConsent({ essential: true, analytics, marketing });
                  setOpen(false);
                }}
                className="rounded-xl bg-neutral-700 px-3 py-2 text-sm text-white hover:bg-neutral-600"
              >
                Salvar preferências
              </button>

              <button
                onClick={() => {
                  writeConsent({ essential: true, analytics: true, marketing: true });
                  setOpen(false);
                }}
                className="rounded-xl bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-500"
              >
                Aceitar tudo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
