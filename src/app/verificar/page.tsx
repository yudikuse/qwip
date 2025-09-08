// src/app/verificar/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// helpers mínimos
const onlyDigits = (s: string) => s.replace(/\D/g, '');
const isValidBR = (d: string) => /^[1-9]{2}9\d{8}$/.test(d);

type StartOk = { ok?: boolean; status?: string };
type StartErr = { error?: string };
type VerifyOk = { ok: boolean; phoneE164?: string };
type VerifyErr = { error?: string };

function Form() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = useMemo(() => searchParams.get('redirect') || '', [searchParams]);

  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState('');

  const valid = isValidBR(phone);

  async function sendCode() {
    try {
      setSending(true);
      setMsg('');
      const to = `+55${phone}`;
      const r = await fetch('/api/otp/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to }),
      });
      const data = (await r.json()) as StartOk | StartErr;
      if (r.ok) {
        setSent(true);
        setMsg('Código enviado! Confira WhatsApp/SMS.');
      } else {
        setMsg((data as StartErr)?.error ?? 'Falhou ao enviar o código.');
      }
    } catch {
      setMsg('Erro ao enviar código.');
    } finally {
      setSending(false);
    }
  }

  async function checkCode() {
    try {
      setChecking(true);
      setMsg('');
      const to = `+55${phone}`;
      const r = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, code }),
      });
      const data = (await r.json()) as VerifyOk | VerifyErr;

      if (r.ok && (data as VerifyOk).ok) {
        // cookie foi gravado pela API -> segue para destino
        router.replace(redirect || '/anuncio/novo');
        return;
      }
      setMsg((data as VerifyErr)?.error ?? 'Falha ao verificar o código.');
    } catch {
      setMsg('Erro inesperado ao verificar.');
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-neutral-800/70 backdrop-blur border border-neutral-700 p-6 md:p-8 shadow-2xl">
          <h1 className="text-2xl font-semibold text-white mb-2">Vamos começar!</h1>
          <p className="text-neutral-400 text-sm mb-4">Insira seu WhatsApp para receber o código.</p>

          <label className="block text-sm text-neutral-300 mb-1">Seu WhatsApp (só números)</label>
          <input
            inputMode="tel"
            autoComplete="tel"
            className="w-full rounded-lg bg-neutral-700/70 border border-neutral-600 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 outline-none px-3 py-2 placeholder-neutral-400"
            placeholder="DD + celular (ex.: 11999998888)"
            value={phone}
            onChange={(e) => setPhone(onlyDigits(e.target.value).slice(0, 11))}
          />
          <p className="mt-2 text-xs">
            {phone.length
              ? (valid
                  ? <span className="text-green-400">Número válido.</span>
                  : <span className="text-amber-400">Formato: DDD + 9 + 8 dígitos.</span>)
              : <span className="text-neutral-400">Não inclua +55, já colocamos automaticamente.</span>}
          </p>

          <button
            onClick={sendCode}
            disabled={!valid || sending}
            className="mt-4 w-full rounded-xl bg-green-500 text-neutral-900 font-semibold py-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-400 transition-colors"
          >
            {sending ? 'Enviando...' : 'Enviar código'}
          </button>

          {sent && (
            <div className="mt-6">
              <label className="block text-sm text-neutral-300 mb-1">Código recebido</label>
              <input
                className="w-full rounded-lg bg-neutral-700/70 border border-neutral-600 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 outline-none px-3 py-2 placeholder-neutral-400"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(onlyDigits(e.target.value).slice(0, 8))}
                inputMode="numeric"
                autoComplete="one-time-code"
              />
              <button
                onClick={checkCode}
                disabled={code.trim().length === 0 || checking}
                className="mt-3 w-full rounded-xl bg-white/10 text-white font-semibold py-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
              >
                {checking ? 'Verificando...' : 'Validar código'}
              </button>
            </div>
          )}

          {msg && <div className="mt-4 text-sm text-center text-neutral-200">{msg}</div>}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <Form />
    </Suspense>
  );
}
