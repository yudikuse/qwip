'use client';

import { useEffect, useState } from 'react';
import { toE164BR } from '@/lib/phone';

type Phase = 'start' | 'code' | 'success';

export default function VerificarSmsPage() {
  const [phase, setPhase] = useState<Phase>('start');

  // telefone (apenas dígitos) + máscara de exibição
  const [phoneDigits, setPhoneDigits] = useState(''); // ex.: "11999998888"
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // consentimento dos termos
  const [consent, setConsent] = useState(false);

  // rota de retorno
  const [redirectTo, setRedirectTo] = useState<string>('/anuncio/novo');
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const r = sp.get('redirect');
      if (r) setRedirectTo(r);
    } catch {}
  }, []);

  // máscara BR: (11) 99999-9999  | para 10 dígitos: (11) 3999-9999
  function maskBR(digits: string) {
    const d = digits.replace(/\D/g, '');
    if (!d) return '';
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
  }
  const phoneMasked = maskBR(phoneDigits);

  function handlePhoneChange(v: string) {
    setErr(null);
    const only = v.replace(/\D/g, '').slice(0, 11); // até 11 dígitos
    setPhoneDigits(only);
  }

  async function onStart(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const e164 = toE164BR(phoneDigits);
    if (!e164) {
      setErr('Informe um número válido. Ex.: (11) 99999-8888');
      return;
    }
    if (!consent) {
      setErr('Para continuar, aceite os Termos de Uso e a Política de Privacidade.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/otp/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: e164 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Falha ao enviar SMS');

      setPhase('code');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  async function onCheck(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const e164 = toE164BR(phoneDigits);
    const otp = code.replace(/\D/g, '');

    if (!e164) {
      setErr('Número inválido.');
      return;
    }
    if (otp.length !== 6) {
      setErr('Digite os 6 dígitos enviados por SMS.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/otp/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: e164, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Código inválido');

      setPhase('success');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  // auto-redirect suave após sucesso (mantém botão visível)
  useEffect(() => {
    if (phase === 'success') {
      const t = setTimeout(() => {
        try {
          window.location.href = redirectTo;
        } catch {}
      }, 700);
      return () => clearTimeout(t);
    }
  }, [phase, redirectTo]);

  const phoneOk = phoneDigits.length >= 10; // 10 ou 11 dígitos

  return (
    <main className="min-h-[calc(100dvh-80px)] w-full bg-background text-foreground">
      <div className="mx-auto w-full max-w-md px-4 py-10">
        {/* Header seguro */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/25">
            {/* cadeado */}
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="text-emerald-400 fill-current">
              <path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm-3 8V6a3 3 0 116 0v3H9z"></path>
            </svg>
          </span>
          <div className="text-center">
            <h1 className="text-xl font-semibold leading-tight">Verificação por SMS</h1>
            <p className="mt-1 text-sm text-neutral-400">
              Usamos um código por SMS para proteger seu acesso e seus anúncios.
            </p>
          </div>
        </div>

        {phase === 'start' && (
          <form
            onSubmit={onStart}
            className="rounded-lg border border-white/10 bg-[#0f131a] p-6 shadow-sm"
          >
            <label htmlFor="phone" className="block text-sm font-medium text-neutral-200">
              Seu número de celular
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              className="mt-2 w-full rounded-md border border-white/15 bg-black/20 px-3 py-2 text-white outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-emerald-500/60"
              placeholder="(11) 99999-8888"
              value={phoneMasked}
              onChange={(e) => handlePhoneChange(e.target.value)}
              disabled={loading}
            />

            {/* bloco de segurança */}
            <div className="mt-3
