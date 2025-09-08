"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Resposta padrão das rotas /api/otp/start e /api/otp/verify
type ApiOk = { ok: true; phoneE164?: string };
type ApiErr = { ok: false; error?: string; retryAfterSec?: number };
type ApiResp = ApiOk | ApiErr;

export default function VerifyClient() {
  const router = useRouter();
  const search = useSearchParams();

  const redirectTo = useMemo(() => {
    const raw = search.get("redirect");
    // fallback seguro
    if (!raw || !raw.startsWith("/")) return "/";
    return raw;
  }, [search]);

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const normalizePhoneLocal = (v: string) =>
    v.replace(/\D+/g, "").slice(0, 11); // DD + celular (até 11 dígitos no BR)

  const onSendCode = useCallback(async () => {
    setMsg(null);

    const cleaned = normalizePhoneLocal(phone);
    if (cleaned.length < 10) {
      setMsg("Informe DD + celular (só números).");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch("/api/otp/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleaned }),
      });

      const data = (await resp.json()) as ApiResp;

      if (!resp.ok || !data.ok) {
        const reason =
          !resp.ok
            ? `Falha ao enviar código (${resp.status}).`
            : ("error" in data && data.error) || "Falha ao enviar código.";
        setMsg(reason);
        return;
      }

      // Enviado com sucesso
      setStep("code");
      setMsg(null);
    } catch {
      setMsg("Erro de rede ao enviar código.");
    } finally {
      setLoading(false);
    }
  }, [phone]);

  const onVerify = useCallback(async () => {
    setMsg(null);

    const cleaned = normalizePhoneLocal(phone);
    if (cleaned.length < 10) {
      setMsg("Informe DD + celular (só números).");
      return;
    }
    if (!/^\d{4,8}$/.test(code)) {
      setMsg("Código inválido.");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleaned, code }),
      });

      const data = (await resp.json()) as ApiResp;

      if (!resp.ok || !data.ok) {
        const reason =
          !resp.ok
            ? `Falha ao verificar código (${resp.status}).`
            : ("error" in data && data.error) || "Código inválido ou expirado.";
        setMsg(reason);
        return;
      }

      // Cookie é gravado no response pelo backend. Pequeno delay garante persistência antes do navigation.
      await new Promise((r) => setTimeout(r, 60));

      // Vai para o destino (ex.: /anuncio/novo)
      router.replace(redirectTo);
    } catch {
      setMsg("Erro de rede ao verificar código.");
    } finally {
      setLoading(false);
    }
  }, [phone, code, redirectTo, router]);

  return (
    <div className="w-full min-h-[60vh] flex items-center justify-center">
      <div className="w-[520px] max-w-[92vw] rounded-2xl bg-neutral-900 p-8 shadow-2xl shadow-black/40">
        <h1 className="text-2xl font-semibold mb-2 text-white">Vamos começar!</h1>
        <p className="text-sm text-neutral-400 mb-6">
          Insira seu WhatsApp para receber o código.
        </p>

        {step === "phone" && (
          <>
            <label className="block text-sm text-neutral-300 mb-2">
              Seu WhatsApp (só números)
            </label>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="tel"
              className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-4 py-3 text-neutral-100 outline-none focus:border-emerald-600"
              placeholder="DD + celular (ex.: 11999998888)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
            />
            <p className="mt-2 text-xs text-neutral-500">
              Não inclua +55, já colocamos automaticamente.
            </p>

            {msg && (
              <div className="mt-3 text-sm text-red-400">
                {msg}
              </div>
            )}

            <button
              onClick={onSendCode}
              disabled={loading}
              className="mt-6 w-full rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 px-4 py-3 text-white font-medium transition"
            >
              {loading ? "Enviando…" : "Enviar código"}
            </button>
          </>
        )}

        {step === "code" && (
          <>
            <label className="block text-sm text-neutral-300 mb-2">
              Código recebido por SMS
            </label>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-4 py-3 text-neutral-100 outline-none focus:border-emerald-600"
              placeholder="Digite o código"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D+/g, ""))}
              disabled={loading}
            />

            {msg && (
              <div className="mt-3 text-sm text-red-400">
                {msg}
              </div>
            )}

            <button
              onClick={onVerify}
              disabled={loading}
              className="mt-6 w-full rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 px-4 py-3 text-white font-medium transition"
            >
              {loading ? "Validando…" : "Validar código"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setMsg(null);
                setCode("");
              }}
              disabled={loading}
              className="mt-3 w-full rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-60 px-4 py-3 text-neutral-200 font-medium transition"
            >
              Voltar e alterar número
            </button>
          </>
        )}
      </div>
    </div>
  );
}
