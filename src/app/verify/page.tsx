'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function onlyDigits(s: string) { return s.replace(/\D/g, ''); }
function isValidBrazilMobile(d: string) { return /^[1-9]{2}9\d{8}$/.test(d); }

function VerifyUI() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectTo = searchParams.get('redirect') || '/anuncio/novo';

  const [rawPhone, setRawPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState('');

  const canSend = isValidBrazilMobile(rawPhone) && consent && !sending;
  const canCheck = code.trim().length > 0 && !checking;

  async function sendCode() {
    try {
      setSending(true); setMsg('');
      const to = `+55${rawPhone}`;
      const r = await fetch('/api/otp/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'Falhou ao enviar o código.');
      setSent(true);
      setMsg('Código enviado! Confira seu WhatsApp (ou SMS).');
    } catch (e: any) {
      setMsg(e?.message || 'Erro ao enviar o código.');
    } finally {
      setSending(false);
    }
  }

  async function verifyCode() {
    try {
      setChecking(true); setMsg('');
      const to = `+55${rawPhone}`;
      const r = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, code }),
      });
      const data = await r.json();
      if (!r.ok || !data?.ok) throw new Error(data?.error || 'Código inválido.');
      // cookie é setado pela API; só navega:
      router.push(redirectTo);
    } catch (e: any) {
      setMsg(e?.message || 'Falha ao verificar o código.');
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-neutral-800/70 border border-neutral-700 p-6">
        <h1 className="text-2xl font-semibold mb-4">Verificação por SMS</h1>

        <label className="block text-sm text-neutral-300 mb-1">Seu WhatsApp (+55)</label>
        <input
          inputMode="tel"
          placeholder="DD + número (ex: 64999999999)"
          className="w-full rounded-lg bg-neutral-700/70 border border-neutral-600 px-3 py-2"
          value={rawPhone}
          onChange={(e) => setRawPhone(onlyDigits(e.target.value).slice(0, 11))}
        />
        <p className="mt-1 text-xs">
          {rawPhone
            ? (isValidBrazilMobile(rawPhone) ? 'Número válido.' : 'Formato: (DD) 9XXXX-XXXX')
            : 'Digite apenas números, sem +55.'}
        </p>

        <div className="mt-3 flex items-center gap-2 text-sm">
          <input id="c" type="checkbox" checked={consent} onChange={(e)=>setConsent(e.target.checked)} />
          <label htmlFor="c">Aceito o envio do código para verificação.</label>
        </div>

        <button
          onClick={sendCode}
          disabled={!canSend}
          className="mt-3 w-full rounded-xl bg-green-500 text-black font-semibold py-3 disabled:opacity-50"
        >
          {sending ? 'Enviando...' : 'Enviar código'}
        </button>

        {sent && (
          <div className="mt-6">
            <label className="block text-sm text-neutral-300 mb-1">Código recebido</label>
            <input
              inputMode="numeric"
              className="w-full rounded-lg bg-neutral-700/70 border border-neutral-600 px-3 py-2"
              placeholder="6 dígitos"
              value={code}
              onChange={(e)=>setCode(onlyDigits(e.target.value).slice(0,8))}
            />
            <button
              onClick={verifyCode}
              disabled={!canCheck}
              className="mt-3 w-full rounded-xl bg-white/10 text-white font-semibold py-3 disabled:opacity-50"
            >
              {checking ? 'Verificando...' : 'Validar código'}
            </button>
          </div>
        )}

        {msg && <div className="mt-4 text-sm text-center">{msg}</div>}
      </div>
    </div>
  );
}

export default function Page() {
  // ⚠️ Next 15 exige Suspense para componentes que usam useSearchParams
  return (
    <Suspense fallback={<div />}>
      <VerifyUI />
    </Suspense>
  );
}
