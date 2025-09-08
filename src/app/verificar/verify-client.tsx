"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type StartResp =
  | { ok: true; phoneE164: string }
  | { ok: false; status: number; error?: string; cooldown?: number };

type VerifyResp =
  | { ok: true; phoneE164: string }
  | { ok: false; status: number; error?: string };

export default function VerifyClient() {
  const sp = useSearchParams();
  const redirect = useMemo(() => sp.get("redirect") || "/", [sp]);

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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
        const err = (!data.ok && data.error) ? data.error : `Falha ao enviar código (${("status" in data && data.status) || resp.status}).`;
        setMsg(err);
        return;
      }

      setSentTo(data.phoneE164);
    } catch {
      setMsg("Erro de rede ao enviar código.");
    } finally {
      setLoading(false);
    }
  }, [phone]);

  const verify = useCallback(async () => {
    setMsg(null);
    setLoading(true);
    try {
      const resp = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });

      const data: VerifyResp = await resp.json();

      if (!resp.ok || !data.ok) {
        const err = (!data.ok && data.error) ? data.error : `Falha na verificação (${("status" in data && data.status) || resp.status}).`;
        setMsg(err);
        return;
      }

      // Redireciona após aprovar
      window.location.replace(redirect || "/");
    } catch {
      setMsg("Erro de rede ao verificar código.");
    } finally {
      setLoading(false);
    }
  }, [phone, code, redirect]);

  // === UI EXISTENTE (mantida) ===
  return (
    <div className="w-full max-w-lg mx-auto">
      {/* bloco do formulário original */}
      {!sentTo ? (
        <div className="space-y-4">
          <input
            inputMode="numeric"
            className="w-full rounded-md bg-neutral-800 text-neutral-100 p-3"
            placeholder="DD + celular (ex.: 11999998888)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button
            onClick={start}
            disabled={loading}
            className="w-full rounded-md bg-green-700 hover:bg-green-600 text-white py-3"
          >
            {loading ? "Enviando..." : "Enviar código"}
          </button>
          {msg && <p className="text-sm text-red-400">{msg}</p>}
        </div>
      ) : (
        <div className="space-y-4">
          <input
            inputMode="numeric"
            className="w-full rounded-md bg-neutral-800 text-neutral-100 p-3"
            placeholder="Código recebido por SMS"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button
            onClick={verify}
            disabled={loading}
            className="w-full rounded-md bg-green-700 hover:bg-green-600 text-white py-3"
          >
            {loading ? "Verificando..." : "Confirmar código"}
          </button>
          <p className="text-xs text-neutral-400">
            Enviado para <span className="font-mono">{sentTo}</span>
          </p>
          {msg && <p className="text-sm text-red-400">{msg}</p>}
        </div>
      )}
    </div>
  );
}
