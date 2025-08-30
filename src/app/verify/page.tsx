'use client';

import { useState } from 'react';

// ===== Tipos seguros p/ API =====
type StartOk = { status: string };                // ex: { status: 'pending' }
type StartErr = { error?: string };

type CheckOk = { status: string; valid: boolean };// ex: { status: 'approved', valid: true }
type CheckErr = { error?: string };

function isErrorWithMessage(x: unknown): x is { message: string } {
  return typeof x === 'object' && x !== null && 'message' in x && typeof (x as any).message === 'string';
}

// ===== Helpers de telefone =====
function onlyDigits(s: string) {
  return s.replace(/\D/g, '');
}

function formatBR(digits: string) {
  // Máx 11 dígitos: 2 (DDD) + 9 + 8
  const d = digits.slice(0, 11);

  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 11)
    return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`;

  return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7, 11)}`;
}

// Regras simples para celular BR: 11 dígitos (DD + 9 + 8)
function isValidBrazilMobile(digits: string) {
  // DDD 2 dígitos 11-99, depois '9' e mais 8 dígitos
  return /^[1-9]{2}9\d{8}$/.test(digits);
}

export default function VerifyPage() {
  // UI state
  const [rawPhone, setRawPhone] = useState(''); // só dígitos
  const [maskedPhone, setMaskedPhone] = useState(''); // máscara BR
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState('');

  // code step
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);

  const validPhone = isValidBrazilMobile(rawPhone);
  const canSend = validPhone && !sending;
  const canCheck = code.trim().length > 0 && !checking;

  function onPhoneChange(value: string) {
    const digits = onlyDigits(value);
    setRawPhone(digits);
    setMaskedPhone(formatBR(digits));
    setMsg('');
  }

  async function sendCode() {
    try {
      setSending(true);
      setMsg('');

      // E.164 sempre com +55
      const to = `+55${rawPhone}`;

      const r = await fetch('/api/otp/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to }),
      });

      const data = (await r.json()) as StartOk | StartErr;

      if (r.ok) {
        setSent(true);
        setMsg('Código enviado! Confira seu WhatsApp (ou SMS se estiver temporário).');
      } else {
        setMsg((data as StartErr)?.error ?? 'Falhou ao enviar o código.');
      }
    } catch (e: unknown) {
      setMsg(isErrorWithMessage(e) ? e.message : 'Erro inesperado.');
    } finally {
      setSending(false);
    }
  }

  async function checkCode() {
    try {
      setChecking(true);
      setMsg('');

      const to = `+55${rawPhone}`;
      const r = await fetch('/api/otp/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, code }),
      });

      const data = (await r.json()) as CheckOk | CheckErr;

      if (r.ok && 'valid' in data && typeof data.valid === 'boolean') {
        if (data.valid) {
          setMsg('✅ Verificado com sucesso!');
        } else {
          setMsg('Código inválido. Tente novamente.');
        }
      } else {
        setMsg((data as CheckErr)?.error ?? 'Falha ao verificar o código.');
      }
    } catch (e: unknown) {
      setMsg(isErrorWithMessage(e) ? e.message : 'Erro inesperado.');
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl bg-neutral-800/70 backdrop-blur border border-neutral-700 p-6 md:p-8 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-green-500/15 border border-green-400/30">
              {/* WhatsApp glyph */}
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-green-400" fill="currentColor">
                <path d="M20.52 3.48A11.86 11.86 0 0 0 12.07 0C5.73 0 .59 4.91.59 11a10.4 10.4 0 0 0 1.37 5.23L0 24l7.94-2.05A12.07 12.07 0 0 0 12.07 22c6.34 0 11.48-4.9 11.48-11S18.41 0 12.07 0h.02a11.86 11.86 0 0 1 8.43 3.48zM12.07 20a10 10 0 0 1-5.2-1.48l-.37-.22-4.73 1.22 1.26-4.6-.24-.38A8.34 8.34 0 0 1 3.74 11c0-4.6 3.79-8 8.33-8s8.33 3.4 8.33 8-3.79 8-8.33 8zm4.61-5.76c-.25-.12-1.49-.73-1.72-.81-.23-.08-.4-.12-.56.12-.16.24-.64.81-.79.98-.14.16-.29.18-.54.06-.25-.12-1.04-.38-1.98-1.22-.73-.64-1.23-1.43-1.37-1.67-.14-.24-.01-.37.11-.48.12-.12.25-.29.37-.44.12-.15.16-.24.24-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.33-.77-1.8-.2-.48-.41-.41-.56-.41h-.48c-.16 0-.43.06-.66.31s-.86.84-.86 2.04.88 2.37 1 2.53c.12.16 1.73 2.64 4.2 3.6.59.25 1.05.4 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.49-.61 1.7-1.19.21-.58.21-1.08.14-1.19-.06-.11-.22-.17-.47-.29z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-white">Vamos começar!</h1>
            <p className="text-neutral-400 text-sm text-center">
              Insira seu WhatsApp para receber o código de verificação.
            </p>
          </div>

          {/* Phone input */}
          <label className="block text-sm text-neutral-300 mb-1">Seu WhatsApp</label>
          <div className="flex items-center gap-2">
            <span className="select-none rounded-lg bg-neutral-700/70 border border-neutral-600 px-3 py-2 text-neutral-200">
              +55
            </span>
            <input
              inputMode="tel"
              autoComplete="tel"
              className="w-full rounded-lg bg-neutral-700/70 border border-neutral-600 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 outline-none px-3 py-2 placeholder-neutral-400"
              placeholder="(11) 9 9999-9999"
              value={maskedPhone}
              onChange={(e) => onPhoneChange(e.target.value)}
            />
          </div>
          <p className="mt-2 text-xs">
            {rawPhone.length > 0 ? (
              validPhone ? (
                <span className="text-green-400">Número válido.</span>
              ) : (
                <span className="text-amber-400">Digite um celular no formato (DD) 9XXXX-XXXX.</span>
              )
            ) : (
              <span className="text-neutral-400">Não precisa digitar +55, já colocamos para você.</span>
            )}
          </p>

          {/* Send button */}
          <button
            onClick={sendCode}
            disabled={!canSend}
            className="mt-4 w-full rounded-xl bg-green-500 text-neutral-900 font-semibold py-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-400 transition-colors"
          >
            {sending ? 'Enviando...' : 'Enviar código'}
          </button>

          {/* Step 2: code */}
          {sent && (
            <div className="mt-6">
              <label className="block text-sm text-neutral-300 mb-1">Código recebido</label>
              <input
                className="w-full rounded-lg bg-neutral-700/70 border border-neutral-600 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 outline-none px-3 py-2 placeholder-neutral-400"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                inputMode="numeric"
                autoComplete="one-time-code"
              />
              <button
                onClick={checkCode}
                disabled={!canCheck}
                className="mt-3 w-full rounded-xl bg-white/10 text-white font-semibold py-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
              >
                {checking ? 'Verificando...' : 'Validar código'}
              </button>
            </div>
          )}

          {/* Messages */}
          {msg && (
            <div className="mt-4 text-sm text-center text-neutral-200">
              {msg}
            </div>
          )}

          {/* Privacy note */}
          <p className="mt-6 text-[13px] leading-relaxed text-neutral-400 text-center">
            Enviamos o código apenas para confirmar sua conta e proteger seu anúncio de spam.
          </p>
        </div>

        {/* Terms */}
        <p className="mt-6 text-center text-sm text-neutral-400">
          Ao continuar, você concorda com nossos{' '}
          <span className="text-green-400">Termos de Uso</span>.
        </p>
      </div>
    </div>
  );
}
