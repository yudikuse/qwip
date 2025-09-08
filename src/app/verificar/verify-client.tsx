// src/app/verificar/verify-client.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

/* Helpers mínimos */
function onlyDigits(s: string) { return s.replace(/\D/g, ""); }
function isValidBrazilMobile(digits: string) { return /^[1-9]{2}9\d{8}$/.test(digits); }

export function VerifyClient() {
  const searchParams = useSearchParams();
  const redirectTo = useMemo(() => searchParams.get("redirect") || "/anuncio/novo", [searchParams]);

  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState("");

  const canSend = isValidBrazilMobile(phone) && !sending;
  const canCheck = code.trim().length > 0 && !checking;

  function onPhoneChange(v: string) {
    setPhone(onlyDigits(v).slice(0, 11));
    setMsg("");
  }

  async function sendCode() {
    try {
      setSending(true);
      setMsg("");
      const to = `+55${phone}`;
      const r = await fetch("/api/otp/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to }),
        // cookies não são necessários para esse POST
      });
      const data = await r.json();
      if (r.ok) {
        setSent(true);
        setMsg("Código enviado! Confira seu WhatsApp/SMS.");
      } else {
        setMsg(data?.error || "Falhou ao enviar o código.");
      }
    } catch (e: any) {
      setMsg(e?.message || "Erro inesperado.");
    } finally {
      setSending(false);
    }
  }

  async function checkCode() {
    try {
      setChecking(true);
      setMsg("");
      const to = `+55${phone}`;

      const r = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // importante: o browser aplica o Set-Cookie desta resposta automaticamente
        body: JSON.stringify({ to, code }),
        credentials: "same-origin",
      });

      const data = await r.json();
      if (r.ok && data?.ok) {
        setMsg("✅ Verificado!");
        // Hard navigation: garante que o middleware receba o cookie já gravado
        const nextUrl = redirectTo.startsWith("/") ? redirectTo : "/anuncio/novo";
        window.location.assign(nextUrl);
      } else {
        setMsg(data?.error || "Código inválido. Tente novamente.");
      }
    } catch (e: any) {
      setMsg(e?.message || "Erro inesperado.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white grid place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-neutral-800/70 border border-neutral-700 p-6 shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold">Vamos começar!</h1>
          <p className="text-neutral-400 text-sm">Insira seu WhatsApp para receber o código.</p>
        </div>

        <label className="block text-sm text-neutral-300 mb-1">Seu WhatsApp (só números)</label>
        <input
          inputMode="tel"
          autoComplete="tel"
          className="w-full rounded-lg bg-neutral-700/70 border border-neutral-600 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 outline-none px-3 py-2 placeholder-neutral-400"
          placeholder="DD + celular (ex.: 11999998888)"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
        />
        <p className="mt-2 text-xs">
          {phone.length > 0 ? (
            isValidBrazilMobile(phone) ? (
              <span className="text-green-400">Número válido.</span>
            ) : (
              <span className="text-amber-400">Use (DD) 9 + 8 dígitos.</span>
            )
          ) : (
            <span className="text-neutral-400">Não inclua +55, já colocamos automaticamente.</span>
          )}
        </p>

        <button
          onClick={sendCode}
          disabled={!canSend}
          className="mt-4 w-full rounded-xl bg-green-600 text-neutral-900 font-semibold py-3 disabled:opacity-50 hover:bg-green-500"
        >
          {sending ? "Enviando..." : "Enviar código"}
        </button>

        {sent && (
          <div className="mt-6">
            <label className="block text-sm text-neutral-300 mb-1">Código recebido</label>
            <input
              className="w-full rounded-lg bg-neutral-700/70 border border-neutral-600 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 outline-none px-3 py-2 placeholder-neutral-400"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
              inputMode="numeric"
              autoComplete="one-time-code"
            />
            <button
              onClick={checkCode}
              disabled={!canCheck}
              className="mt-3 w-full rounded-xl bg-white/10 text-white font-semibold py-3 disabled:opacity-50 hover:bg-white/20"
            >
              {checking ? "Verificando..." : "Validar código"}
            </button>
          </div>
        )}

        {msg && <div className="mt-4 text-sm text-center text-neutral-200">{msg}</div>}
      </div>
    </div>
  );
}
