'use client';

import { useEffect, useState } from 'react';

type Phase = 'start' | 'code' | 'success';

export default function VerificarWhatsappPage() {
  const [phase, setPhase] = useState<Phase>('start');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // rota de retorno (default volta pra criação de anúncio)
  const [redirectTo, setRedirectTo] = useState<string>('/anuncio/novo');

  // lê ?redirect=/alguma-rota
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const r = sp.get('redirect');
      if (r) setRedirectTo(r);
    } catch {}
  }, []);

  // mantém o formato E.164 que sua API espera tratar (+55...)
  function normE164(raw: string) {
    const trimmed = raw.replace(/[\s-]/g, '');
    return trimmed;
  }

  async function onStart(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const to = normE164(phone);

    if (!/^\+\d{8,15}$/.test(to)) {
      setErr('Informe no formato E.164, ex.: +5511999998888');
      return;
    }

    setLoading(true);
    try {
      // AQUI O AJUSTE: a rota /api/otp/start espera { phone }
      const res = await fetch('/api/otp/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: to }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Falha ao enviar código');

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

    const to = normE164(phone);
    const otp = code.trim();

    if (!otp || otp.length < 4) {
      setErr('Digite o código recebido no WhatsApp.');
      return;
    }

    setLoading(true);
    try {
      // /api/otp/check agora seta o cookie ao aprovar
      const res = await fetch('/api/otp/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, code: otp }),
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

  // opcional: auto-redirect após sucesso (mantendo o botão na UI)
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
          <h1 className="text-2xl font-semibold tracking-tight">Verificação por WhatsApp</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Confirmamos seu número antes de criar/gerenciar anúncios.
          </p>
        </div>

        {phase === 'start' && (
          <form onSubmit={onStart} className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <label htmlFor="phone" className="block text-sm font-medium">
              Número de WhatsApp (E.164)
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              className="mt-2 w-full rounded-md border border-border bg-input/10 px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--ring)]"
              placeholder="+5511999998888"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
            />

            {err && <p className="mt-3 text-sm text-red-400">{err}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-[var(--primary)] font-medium text-[var(--primary-foreground)] transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Enviando…' : 'Enviar código via WhatsApp'}
            </button>

            <p className="mt-3 text-xs text-muted-foreground">
              Você receberá uma mensagem oficial do WhatsApp com um código de 4–10 dígitos.
            </p>
          </form>
        )}

        {phase === 'code' && (
          <form onSubmit={onCheck} className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Enviamos um código para <span className="font-medium text-foreground">{normE164(phone)}</span>.
              </p>
            </div>

            <label htmlFor="code" className="block text-sm font-medium">
              Código recebido no WhatsApp
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              className="mt-2 w-full rounded-md border border-border bg-input/10 px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--ring)] tracking-widest"
              placeholder="••••"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={loading}
            />

            {err && <p className="mt-3 text-sm text-red-400">{err}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-[var(--primary)] font-medium text-[var(--primary-foreground)] transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Validando…' : 'Validar código'}
            </button>

            <button
              type="button"
              onClick={() => setPhase('start')}
              disabled={loading}
              className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-md border border-border bg-transparent text-sm transition hover:bg-white/5 disabled:opacity-50"
            >
              Reenviar para outro número
            </button>
          </form>
        )}

        {phase === 'success' && (
          <div className="rounded-lg border border-border bg-card p-6 text-center shadow-sm">
            <h2 className="text-xl font-semibold">Número verificado! ✅</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Agora você pode continuar para criar seu anúncio.
            </p>

            <a
              href={redirectTo} // volta para a rota protegida solicitada
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-[var(--primary)] font-medium text-[var(--primary-foreground)] transition hover:opacity-90"
            >
              Continuar
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
