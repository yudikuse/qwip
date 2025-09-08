// src/app/verificar/verify-client.tsx
"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Tipos discriminados para o TS fazer narrowing corretamente
type StartResp =
  | { ok: true; phoneE164: string; status?: number }
  | { ok: false; error: string; status?: number };

type CheckResp =
  | { ok: true; approved: true; status?: number }
  | { ok: false; error: string; status?: number };

export default function VerifyClient() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const params = useSearchParams();

  const redirect = useMemo(() => {
    const raw = params.get("redirect");
    return raw ? decodeURIComponent(raw) : "/anuncio/novo";
  }, [params]);

  const onSend = useCallback(async () => {
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
        setMsg(
          "error" in data
            ? data.error
            : `Falha ao enviar código (${data.status ?? resp.status}).`
        );
        return;
      }

      setSentTo(data.phoneE164);
      setMsg(null);
    } catch (e) {
      setMsg("Erro ao enviar código. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [phone]);

  const onVerify = useCallback(async () => {
    setMsg(null);
    setLoading(true);
    try {
      const resp = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });

      const data: CheckResp = await resp.json();

      if (!resp.ok || !data.ok || !("approved" in data && data.approved)) {
        setMsg(
          "error" in data
            ? data.error
            : `Código inválido ou expirado (${data.status ?? resp.status}).`
        );
        return;
      }

      // navegação controlada no cliente após a aprovação
      router.replace(redirect);
    } catch (e) {
      setMsg("Erro ao validar o código. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [phone, code, redirect, router]);

  // === Layout (mantido: card central, título, inputs, botões) ===
  return (
    <div className="min-h-[calc(100dvh)] bg-[#0b0f0e] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-[680px] rounded-2xl bg-[#151a19] shadow-2xl shadow-black/30 p-8">
        <h1 className="text-2xl md:text-[28px] font-bold mb-2">
          Vamos começar!
        </h1>
        <p className="text-sm text-white/70 mb-6">
          Insira seu WhatsApp para receber o código.
        </p>

        {!sentTo ? (
          <>
            <label className="block text-sm font-semibold mb-2">
              Seu WhatsApp (só números)
            </label>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="DD + celular (ex.: 11999998888)"
              className="w-full rounded-md bg-[#222726] text-white placeholder-white/40 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500 transition"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-white/50 mt-2">
              Não inclua +55, já colocamos automaticamente.
            </p>

            {msg && (
              <div className="mt-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-md px-3 py-2">
                {msg}
              </div>
            )}

            <button
              onClick={onSend}
              disabled={loading || !phone.trim()}
              className="mt-6 w-full rounded-md bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 font-semibold transition"
            >
              {loading ? "Enviando..." : "Enviar código"}
            </button>
          </>
        ) : (
          <>
            <label className="block text-sm font-semibold mb-2">
              Código recebido por SMS
            </label>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="000000"
              className="w-full rounded-md bg-[#222726] text-white placeholder-white/40 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500 transition"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-white/50 mt-2">
              Enviado para <span className="font-medium">{sentTo}</span>
            </p>

            {msg && (
              <div className="mt-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-md px-3 py-2">
                {msg}
              </div>
            )}

            <button
              onClick={onVerify}
              disabled={loading || !code.trim()}
              className="mt-6 w-full rounded-md bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 font-semibold transition"
            >
              {loading ? "Confirmando..." : "Confirmar código"}
            </button>

            <button
              type="button"
              onClick={() => {
                setSentTo(null);
                setCode("");
                setMsg(null);
              }}
              className="mt-3 w-full text-sm text-white/70 hover:text-white transition"
            >
              Editar número
            </button>
          </>
        )}
      </div>
    </div>
  );
}
