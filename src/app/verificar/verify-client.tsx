"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

type ApiResp =
  | { ok: true; phoneE164?: string }
  | { ok: false; error: string; retryAfterSec?: number };

function onlyDigits(v: string) {
  return v.replace(/\D+/g, "");
}

function safeRedirect(v: string | null | undefined) {
  // garante que não haja open redirect
  if (!v) return "/";
  try {
    const dec = decodeURIComponent(v);
    return dec.startsWith("/") ? dec : "/";
  } catch {
    return "/";
  }
}

export default function VerifyClient() {
  const router = useRouter();
  const search = useSearchParams();

  const [phoneRaw, setPhoneRaw] = React.useState("");
  const [code, setCode] = React.useState("");
  const [step, setStep] = React.useState<"start" | "verify">("start");
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // destino após sucesso (ex.: /anuncio/novo)
  const redirectTo = React.useMemo(
    () => safeRedirect(search.get("redirect")),
    [search]
  );

  const phoneDigits = React.useMemo(() => onlyDigits(phoneRaw), [phoneRaw]);

  async function handleStart(e?: React.FormEvent) {
    e?.preventDefault();
    setErrorMsg(null);

    // Brasil: DDD + celular => 10~11 dígitos (ex.: 11999998888)
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      setErrorMsg("Digite seu DDD + celular (ex.: 11999998888).");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch("/api/otp/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: phoneDigits }),
      });
      const data = (await resp.json()) as ApiResp;

      if (!resp.ok || !data.ok) {
        setErrorMsg(
          !resp.ok
            ? `Falha ao enviar código (${resp.status}).`
            : data.error || "Falha ao enviar código."
        );
        return;
      }

      // Avança para passo de verificação
      setStep("verify");
      // Foca no input de código
      setTimeout(() => {
        const el = document.getElementById("otp-code") as HTMLInputElement | null;
        el?.focus();
      }, 0);
    } catch (err) {
      setErrorMsg("Erro de rede ao enviar o código.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e?: React.FormEvent) {
    e?.preventDefault();
    setErrorMsg(null);

    const codeDigits = onlyDigits(code);
    if (codeDigits.length < 4) {
      setErrorMsg("Digite o código recebido por SMS.");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: phoneDigits, code: codeDigits }),
      });
      const data = (await resp.json()) as ApiResp;

      if (!resp.ok || !data.ok) {
        setErrorMsg(
          !resp.ok
            ? `Código inválido (${resp.status}).`
            : data.error || "Código inválido ou expirado."
        );
        return;
      }

      // ✅ Sucesso: cookie já foi gravado pelo backend.
      // Redireciona de imediato para o destino solicitado.
      window.location.replace(redirectTo);
    } catch (err) {
      setErrorMsg("Erro de rede ao verificar o código.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full flex items-center justify-center py-10">
      <div className="w-full max-w-md rounded-2xl bg-neutral-900/80 p-6 shadow-2xl">
        <h1 className="text-2xl font-semibold text-white mb-1">
          Vamos começar!
        </h1>
        <p className="text-sm text-neutral-400 mb-6">
          Insira seu WhatsApp para receber o código.
        </p>

        {step === "start" && (
          <form onSubmit={handleStart} className="space-y-4">
            <label className="block text-sm text-neutral-300">
              Seu WhatsApp (só números)
            </label>
            <input
              inputMode="numeric"
              autoComplete="tel"
              className="w-full rounded-md bg-neutral-800 px-3 py-2 text-neutral-100 outline-none ring-1 ring-neutral-700 focus:ring-2 focus:ring-emerald-600"
              placeholder="DD + celular (ex.: 11999998888)"
              value={phoneRaw}
              onChange={(e) => setPhoneRaw(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-neutral-500 -mt-2">
              Não inclua +55, já colocamos automaticamente.
            </p>

            {errorMsg && (
              <div className="text-sm text-red-400">{errorMsg}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 px-4 py-2 font-medium text-white transition"
            >
              {loading ? "Enviando..." : "Enviar código"}
            </button>
          </form>
        )}

        {step === "verify" && (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="text-sm text-neutral-300">
              Enviamos um SMS para{" "}
              <span className="font-medium">
                +55 {phoneDigits.replace(/(\d{2})(\d+)/, "($1) $2")}
              </span>
              .
            </div>

            <label className="block text-sm text-neutral-300">
              Código recebido
            </label>
            <input
              id="otp-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="w-full rounded-md bg-neutral-800 px-3 py-2 text-neutral-100 outline-none ring-1 ring-neutral-700 focus:ring-2 focus:ring-emerald-600 tracking-widest"
              placeholder="••••"
              value={onlyDigits(code)}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              disabled={loading}
            />

            {errorMsg && (
              <div className="text-sm text-red-400">{errorMsg}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 px-4 py-2 font-medium text-white transition"
            >
              {loading ? "Confirmando..." : "Confirmar código"}
            </button>

            <button
              type="button"
              onClick={handleStart}
              disabled={loading}
              className="w-full rounded-md bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 px-4 py-2 font-medium text-neutral-100 transition"
              title="Reenviar SMS"
            >
              Reenviar código
            </button>

            <button
              type="button"
              onClick={() => setStep("start")}
              disabled={loading}
              className="w-full rounded-md bg-transparent px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200"
            >
              Trocar número
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
