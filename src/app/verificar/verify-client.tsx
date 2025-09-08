"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

type StartResp =
  | { ok: true; phoneE164: string }
  | { ok: false; status: number; error?: string; cooldown?: number };

type VerifyResp =
  | { ok: true; phoneE164: string }
  | { ok: false; status: number; error?: string };

const phoneMask = (v: string) => v.replace(/\D+/g, "").slice(0, 11);

export default function VerifyClient() {
  const search = useSearchParams();
  const redirect = search.get("redirect") || "/anuncio/novo";

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [rawPhone, setRawPhone] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleStart() {
    setMsg(null);
    const digits = phoneMask(rawPhone);
    if (digits.length < 10) {
      setMsg("Número inválido.");
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch("/api/otp/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone: digits }),
      });
      const data: StartResp = await resp.json();
      if (!resp.ok || !data.ok) {
        setMsg(data.error || `Falha ao enviar código (${data.status}).`);
        return;
      }
      setSentTo(data.phoneE164);
      setStep("code");
      setMsg("Código enviado por SMS.");
    } catch {
      setMsg("Erro ao enviar código.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setMsg(null);
    if (code.replace(/\D+/g, "").length < 4) {
      setMsg("Digite o código recebido.");
      return;
    }
    if (!sentTo) {
      setMsg("Telefone não confirmado para envio.");
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone: rawPhone, code }),
      });
      const data: VerifyResp = await resp.json();

      if (!resp.ok || !data.ok) {
        setMsg(data.error || `Código inválido (${data.status}).`);
        return;
      }

      // Redireciono com page load completa para garantir o cookie
      setTimeout(() => {
        window.location.replace(redirect);
      }, 120);
    } catch {
      setMsg("Falha ao verificar código.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center">
      <div className="w-[680px] max-w-[92vw] bg-[#121212] border border-[#1f1f1f] rounded-xl shadow-2xl px-8 py-8">
        <h1 className="text-2xl font-bold mb-2">Vamos começar!</h1>
        <p className="text-sm text-neutral-300 mb-6">Insira seu WhatsApp para receber o código.</p>

        {step === "phone" && (
          <>
            <label className="text-sm font-semibold">Seu WhatsApp (só números)</label>
            <input
              className="mt-2 w-full rounded-md bg-[#1a1a1a] border border-[#2a2a2a] px-4 py-3 outline-none"
              inputMode="numeric"
              placeholder="DD + celular (ex.: 11999998888)"
              value={rawPhone}
              onChange={(e) => setRawPhone(phoneMask(e.target.value))}
              disabled={loading}
            />
            <p className="text-xs text-neutral-400 mt-2">Não inclua +55, já colocamos automaticamente.</p>
            <button
              className="mt-6 w-full bg-green-700 hover:bg-green-800 text-white rounded-md py-3 font-semibold disabled:opacity-60"
              onClick={handleStart}
              disabled={loading}
            >
              {loading ? "Enviando..." : "Enviar código"}
            </button>
          </>
        )}

        {step === "code" && (
          <>
            <label className="text-sm font-semibold">Digite o código recebido</label>
            <input
              className="mt-2 w-full rounded-md bg-[#1a1a1a] border border-[#2a2a2a] px-4 py-3 outline-none tracking-widest text-center"
              inputMode="numeric"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D+/g, "").slice(0, 6))}
              disabled={loading}
            />
            <button
              className="mt-6 w-full bg-green-700 hover:bg-green-800 text-white rounded-md py-3 font-semibold disabled:opacity-60"
              onClick={handleVerify}
              disabled={loading}
            >
              {loading ? "Verificando..." : "Confirmar código"}
            </button>
            <button
              className="mt-3 w-full bg-transparent border border-[#2a2a2a] hover:bg-[#1a1a1a] text-white rounded-md py-3 font-medium disabled:opacity-60"
              onClick={() => setStep("phone")}
              disabled={loading}
            >
              Voltar e alterar número
            </button>
          </>
        )}

        {msg && <p className="mt-4 text-sm text-neutral-300">{msg}</p>}
      </div>
    </div>
  );
}
