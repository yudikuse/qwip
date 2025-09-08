// src/app/verificar/verify-client.tsx
"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type ApiResp =
  | { ok: true; phoneE164?: string }
  | { ok: false; error?: string; status?: number };

const maskPhone = (v: string) =>
  v.replace(/\D/g, "").slice(0, 11);

export default function VerifyClient() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = useMemo(() => params.get("redirect") || "/vitrine", [params]);

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // mantém UI que você já tem
  }, []);

  async function startOtp() {
    setError(null);
    const to = maskPhone(phone);
    if (to.length < 10) {
      setError("Preencha DD + celular (só números).");
      return;
    }

    const resp = await fetch("/api/otp/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone: to }),
      credentials: "same-origin",
    });

    const data = (await resp.json()) as ApiResp;
    if (!resp.ok || !("ok" in data) || !data.ok) {
      setError(data && "error" in data && data.error ? data.error : "Falha ao enviar código.");
      return;
    }
    setStep("code");
  }

  async function verifyOtp() {
    setError(null);
    if (code.replace(/\D/g, "").length < 4) {
      setError("Informe o código recebido.");
      return;
    }

    const resp = await fetch("/api/otp/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone, code }),
      credentials: "same-origin",
    });

    const data = (await resp.json()) as ApiResp;
    if (!resp.ok || !("ok" in data) || !data.ok) {
      setError(data && "error" in data && data.error ? data.error : "Código inválido ou expirado.");
      return;
    }

    // Cookie já foi gravado no response do /api/otp/verify.
    // Agora navegamos para o destino (middleware não redireciona mais).
    startTransition(() => {
      router.replace(redirect);
    });
  }

  // ===== UI existente (mantida) =====
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-xl rounded-2xl bg-neutral-900 p-8 shadow-2xl">
        <h1 className="mb-2 text-3xl font-bold">Vamos começar!</h1>
        <p className="mb-6 text-sm text-neutral-300">
          Insira seu WhatsApp para receber o código.
        </p>

        {step === "phone" && (
          <>
            <label className="mb-2 block text-sm font-medium">Seu WhatsApp (só números)</label>
            <input
              inputMode="numeric"
              className="mb-3 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 outline-none"
              placeholder="DD + celular (ex.: 11999998888)"
              value={phone}
              onChange={(e) => setPhone(maskPhone(e.target.value))}
            />
            <p className="mb-4 text-xs text-neutral-400">Não inclua +55, já colocamos automaticamente.</p>
            {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
            <button
              onClick={startOtp}
              disabled={isPending}
              className="w-full rounded-lg bg-emerald-700 px-4 py-3 font-medium hover:bg-emerald-600 disabled:opacity-60"
            >
              Enviar código
            </button>
          </>
        )}

        {step === "code" && (
          <>
            <label className="mb-2 block text-sm font-medium">Código recebido por SMS</label>
            <input
              inputMode="numeric"
              className="mb-3 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 outline-none"
              placeholder="Ex.: 123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setStep("phone")}
                className="w-1/3 rounded-lg border border-neutral-700 px-4 py-3"
              >
                Voltar
              </button>
              <button
                onClick={verifyOtp}
                disabled={isPending}
                className="w-2/3 rounded-lg bg-emerald-700 px-4 py-3 font-medium hover:bg-emerald-600 disabled:opacity-60"
              >
                Confirmar código
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
