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

    // converte para E.164 (+55…) na hora de enviar
    const e164 = toE164BR(phoneDigits);
    if (!e164) {
      setErr('Informe um número válido. Ex.: (11) 99999-8888');
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
      // /api/otp/check já seta o cookie quando aprovado
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

  return (
    <main className="min-h-[calc(100dvh-80px)] w-full bg-background text-foreground">
      <div className="mx-auto w-full max-w-md px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Verificação por SMS</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Confirmamos seu número antes de criar/gerenciar anúncios.
          </p>
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

            {err && <p className="mt-3 text-sm text-red-400">{err}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-emerald-500 font-medium text-[#0F1115] transition hover:bg-emerald-400 disabled:opacity-50"
            >
              {loading ? 'Enviando…' : 'Enviar código por SMS'}
            </button>

            <p className="mt-3 text-xs text-neutral-400">
              Você receberá um <b>SMS</b> com um código de 6 dígitos.
            </p>
          </form>
        )}

        {phase === 'code' && (
          <form
            onSubmit={onCheck}
            className="rounded-lg border border-white/10 bg-[#0f131a] p-6 shadow-sm"
          >
            <div className="mb-4">
              <p className="text-sm text-neutral-300">
                Enviamos um SMS para{' '}
                <span className="font-medium text-white">{phoneMasked || 'seu número'}</span>.
              </p>
            </div>

            <label htmlFor="code" className="block text-sm font-medium text-neutral-200">
              Código (6 dígitos)
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              className="mt-2 w-full rounded-md border border-white/15 bg-black/20 px-3 py-2 text-white outline-none placeholder:text-zinc-500 tracking-widest focus:ring-2 focus:ring-emerald-500/60"
              placeholder="••••••"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={loading}
            />

            {err && <p className="mt-3 text-sm text-red-400">{err}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-emerald-500 font-medium text-[#0F1115] transition hover:bg-emerald-400 disabled:opacity-50"
            >
              {loading ? 'Validando…' : 'Validar código'}
            </button>

            <button
              type="button"
              onClick={() => setPhase('start')}
              disabled={loading}
              className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-md border border-white/10 bg-transparent text-sm text-white transition hover:bg-white/5 disabled:opacity-50"
            >
              Reenviar para outro número
            </button>
          </form>
        )}

        {phase === 'success' && (
          <div className="rounded-lg border border-white/10 bg-[#0f131a] p-6 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-white">Número verificado! ✅</h2>
            <p className="mt-2 text-sm text-neutral-400">
              Agora você pode continuar para criar seu anúncio.
            </p>

            <a
              href={redirectTo}
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-emerald-500 font-medium text-[#0F1115] transition hover:bg-emerald-400"
            >
              Continuar
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
