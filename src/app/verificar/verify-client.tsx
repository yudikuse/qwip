"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { StartResp, CheckResp } from "@/lib/twilio";
import { maskPhoneE164 } from "@/lib/phone";

export default function VerifyClient() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/";

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const maskedSent = useMemo(() => maskPhoneE164(sentTo), [sentTo]);

  const start = useCallback(async () => {
    setMsg(null);
    setLoading(true);
    try {
      const resp = await fetch("/api/otp/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data: StartResp = await resp.json();
      if (!resp.ok || !data.ok) {
        setMsg(data.error || `Falha ao enviar código (${data.status ?? resp.status}).`);
        return;
      }
      setSentTo(data.phoneE164 || null);
      setStep("code");
    } catch (e: any) {
      setMsg("Erro de rede ao iniciar verificação.");
    } finally {
      setLoading(false);
    }
  }, [phone]);

  const confirm = useCallback(async () => {
    setMsg(null);
    setLoading(true);
    try {
      const resp = await fetch("/api/otp/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data: CheckResp = await resp.json();
      if (!resp.ok || !data.ok) {
        setMsg(data.error || `Código inválido ou expirado (${data.status ?? resp.status}).`);
        return;
      }
      // OK → redireciona
      router.replace(redirect);
    } catch {
      setMsg("Erro de rede ao validar código.");
    } finally {
      setLoading(false);
    }
  }, [code, redirect, router]);

  // UI/estilo preservado (mesma estrutura de cartão)
  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center">
      <div className="w-full max-w-2xl rounded-2xl bg-neutral-900/80 shadow-xl p-8 border border-neutral-800">
        <h1 className="text-3xl font-semibold mb-2">Vamos começar!</h1>
        <p className="text-sm text-neutral-300 mb-6">
          Insira seu WhatsApp para receber o código.
        </p>

        {step === "phone" && (
          <div className="space-y-4">
            <label className="text-sm block">Seu WhatsApp (só números)</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="DD + celular (ex.: 11999998888)"
              className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
              inputMode="numeric"
            />
            {msg && (
              <div className="rounded-md border border-red-700 bg-red-900/30 text-red-300 px-4 py-2">
                {msg}
              </div>
            )}
            <button
              onClick={start}
              disabled={loading}
              className="w-full rounded-md bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 px-4 py-3 font-medium"
            >
              {loading ? "Enviando..." : "Enviar código"}
            </button>
          </div>
        )}

        {step === "code" && (
          <div className="space-y-4">
            <label className="text-sm block">Código recebido por SMS</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Código recebido por SMS"
              className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
              inputMode="numeric"
            />
            <p className="text-xs text-neutral-400">
              Enviado para {maskedSent}.
            </p>
            {msg && (
              <div className="rounded-md border border-red-700 bg-red-900/30 text-red-300 px-4 py-2">
                {msg}
              </div>
            )}
            <button
              onClick={confirm}
              disabled={loading}
              className="w-full rounded-md bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 px-4 py-3 font-medium"
            >
              {loading ? "Confirmando..." : "Confirmar código"}
            </button>
            <button
              onClick={() => {
                setStep("phone");
                setMsg(null);
              }}
              className="text-sm text-neutral-300 underline underline-offset-4"
            >
              Editar número
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
