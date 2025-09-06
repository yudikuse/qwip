'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

/* =========================
   Type definitions for API responses
   ========================= */
type StartOk = { ok?: boolean; phoneE164?: string };
type StartErr = { error?: string };
type CheckOk = { ok?: boolean; phoneE164?: string };
type CheckErr = { error?: string };

/* ===== Helpers ===== */
function onlyDigits(s: string) {
  return s.replace(/\D/g, '');
}
function formatBR(digits: string) {
  const d = digits.slice(0, 11);
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 11)
    return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7, 11)}`;
}
function isValidBrazilMobile(digits: string) {
  return /^[1-9]{2}9\d{8}$/.test(digits);
}

function TermsModal({
  open,
  onClose,
  onAccept,
}: {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-neutral-900 text-neutral-100 border border-neutral-700 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-700">
          <h2 className="text-lg font-semibold">Termos de Uso & Aviso de Privacidade</h2>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 hover:bg-neutral-800 text-neutral-300"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-4 space-y-4 text-sm">
          <p>
            <strong>Última atualização:</strong> 30/08/2025 — <strong>Versão:</strong> v1.
          </p>

          <h3 className="font-semibold text-neutral-200">1. Quem somos</h3>
          <p>
            Qwip (“nós”) é a controladora dos dados tratados neste site para fins de verificação
            de conta e prevenção de abuso.
          </p>

          <h3 className="font-semibold text-neutral-200">2. Dados coletados</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Número de telefone celular (WhatsApp) informado por você.</li>
            <li>Metadados técnicos mínimos (ex.: horário do envio/validação).</li>
          </ul>

          <h3 className="font-semibold text-neutral-200">3. Finalidades</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Enviar e validar um código de verificação (OTP) para acessar recursos.</li>
            <li>Prevenir fraudes e uso indevido da plataforma.</li>
          </ul>

          <h3 className="font-semibold text-neutral-200">4. Base legal (LGPD)</h3>
          <p>
            Utilizamos a base legal do <strong>consentimento</strong> (art. 7º, I) para enviar e
            validar o código. Você pode revogar este consentimento a qualquer momento.
          </p>

          <h3 className="font-semibold text-neutral-200">5. Compartilhamento</h3>
          <p>
            Para enviar o código, utilizamos provedores de comunicação (ex.: Twilio). Esses
            operadores tratam apenas o necessário para a entrega do OTP.
          </p>

          <h3 className="font-semibold text-neutral-200">6. Retenção</h3>
          <p>
            Mantemos registros de verificação pelo tempo necessário para comprovação de segurança e
            auditoria, ou enquanto houver obrigação legal.
          </p>

          <h3 className="font-semibold text-neutral-200">7. Seus direitos</h3>
          <p>
            Você pode solicitar acesso, correção, exclusão, portabilidade e informações sobre
            compartilhamentos, além de revogar o consentimento. Contato do DPO:
            <br />
            <a href="mailto:privacidade@qwip.pro" className="text-green-400 underline">
              privacidade@qwip.pro
            </a>
            .
          </p>

          <h3 className="font-semibold text-neutral-200">8. Segurança</h3>
          <p>
            Adotamos medidas técnicas e organizacionais para proteger seus dados. Contudo, nenhum
            sistema é 100% seguro. Em caso de incidente, seguiremos os procedimentos legais.
          </p>

          <h3 className="font-semibold text-neutral-200">9. Alterações</h3>
          <p>
            Podemos atualizar estes termos. A versão vigente é identificada no topo deste documento.
          </p>

          <p className="text-neutral-300">
            Ao aceitar, você concorda com o envio do OTP ao seu número e com este tratamento de
            dados para as finalidades descritas.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-neutral-700">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 bg-white/10 hover:bg-white/15 text-white"
          >
            Cancelar
          </button>
          <button
            onClick={onAccept}
            className="rounded-xl px-4 py-2 bg-green-500 text-neutral-900 font-semibold hover:bg-green-400"
          >
            Aceito os termos
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const redirectParam = searchParams?.get('redirect');
  const redirectTo = redirectParam && redirectParam.startsWith("/")
    ? redirectParam
    : "/anuncio/novo";

  // phone state
  const [rawPhone, setRawPhone] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const validPhone = isValidBrazilMobile(rawPhone);

  // terms state
  const TERMS_KEY = 'qwip_terms_v1';
  const [consent, setConsent] = useState(false);
  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    const accepted = localStorage.getItem(TERMS_KEY) === 'true';
    if (accepted) setConsent(true);
  }, []);

  // UI state
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState('');
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);

  const canSend = validPhone && consent && !sending;
  const canCheck = code.trim().length > 0 && !checking;

  function onPhoneChange(value: string) {
    const digits = onlyDigits(value);
    setRawPhone(digits);
    setMaskedPhone(formatBR(digits));
    setMsg('');
  }

  function openTerms() {
    setShowModal(true);
  }
  function acceptTerms() {
    setConsent(true);
    localStorage.setItem(TERMS_KEY, 'true');
    setShowModal(false);
  }

  async function sendCode() {
    try {
      setSending(true);
      setMsg('');
      const to = `+55${rawPhone}`;

      const r = await fetch('/api/otp/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to }),
      });

      const data = (await r.json()) as StartOk | StartErr;
      if (r.ok && (data as StartOk)?.ok) {
        setSent(true);
        setMsg('Código enviado! Confira seu WhatsApp (ou SMS).');
      } else {
        setMsg((data as StartErr)?.error ?? 'Falhou ao enviar o código.');
      }
    } catch (e) {
      setMsg('Erro inesperado.');
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
      if (r.ok && (data as CheckOk)?.ok) {
        // Redundant: set cookie via client in case server cookie fails
        document.cookie =
          `qwip_phone_e164=${encodeURIComponent(to)}; ` +
          `Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax; Secure`;

        setMsg('✅ Verificado! Redirecionando...');
        // Redirect to the intended page
        try {
          window.location.replace(redirectTo);
        } catch {
          window.location.href = redirectTo;
        }
      } else {
        setMsg((data as CheckErr)?.error ?? 'Falha ao verificar o código.');
      }
    } catch {
      setMsg('Erro inesperado.');
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-neutral-800/70 backdrop-blur border border-neutral-700 p-6 md:p-8 shadow-2xl">
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-green-500/15 border border-green-400/30">
              {/* Shield icon */}
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

          {/* Consent */}
          <div className="mt-4 flex items-start gap-2 text-sm">
            <input
              id="consent"
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (e.target.checked) {
                  localStorage.setItem(TERMS_KEY, 'true');
                } else {
                  localStorage.removeItem(TERMS_KEY);
                }
              }}
              className="mt-1 h-4 w-4 accent-green-500"
            />
            <label htmlFor="consent" className="text-neutral-300">
              Li e aceito os{' '}
              <button
                type="button"
                onClick={openTerms}
                className="text-green-400 underline underline-offset-2"
              >
                Termos de Uso e Aviso de Privacidade
              </button>
              .
            </label>
          </div>

          {/* Send code button */}
          <button
            onClick={sendCode}
            disabled={!canSend}
            className="mt-4 w-full rounded-xl bg-green-500 text-neutral-900 font-semibold py-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-400 transition-colors"
          >
            {sending ? 'Enviando...' : 'Enviar código'}
          </button>

          {/* Code input and check button */}
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
          {msg && <div className="mt-4 text-sm text-center text-neutral-200">{msg}</div>}

          {/* Note */}
          <p className="mt-6 text-[13px] leading-relaxed text-neutral-400 text-center">
            Enviamos o código apenas para confirmar sua conta e proteger seu anúncio de spam.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-neutral-400">
          Ao continuar, você concorda com nossos{' '}
          <button onClick={openTerms} className="text-green-400 underline">
            Termos de Uso
          </button>
          .
        </p>
      </div>

      {/* Modal */}
      <TermsModal open={showModal} onClose={() => setShowModal(false)} onAccept={acceptTerms} />
    </div>
  );
}
