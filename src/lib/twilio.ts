// src/lib/twilio.ts
/**
 * Integração mínima com Twilio Verify via REST (sem SDK).
 * Requer as envs:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_VERIFY_SERVICE_SID
 */
type VerifyOk = {
  ok: true;
  sid?: string;
  status?: string; // "pending" no start, "approved" no check
  approved?: boolean;
};
type VerifyErr = { ok: false; error: string; statusCode?: number };
export type StartResp = VerifyOk | VerifyErr;
export type CheckResp = VerifyOk | VerifyErr;

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_VERIFY_SERVICE_SID,
} = process.env;

function authHeader() {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error("Credenciais Twilio ausentes.");
  }
  const token = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
  return `Basic ${token}`;
}

const BASE = "https://verify.twilio.com/v2";

export async function startOtpViaVerify(toE164: string): Promise<StartResp> {
  try {
    if (!TWILIO_VERIFY_SERVICE_SID) throw new Error("TWILIO_VERIFY_SERVICE_SID ausente.");
    const url = `${BASE}/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`;
    const body = new URLSearchParams({ To: toE164, Channel: "sms" });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data?.message || "Falha ao iniciar verificação.", statusCode: res.status };
    }
    // data.status normalmente "pending"
    return { ok: true, sid: data?.sid, status: data?.status };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Erro inesperado ao iniciar verificação." };
  }
}

export async function checkOtpViaVerify(toE164: string, code: string): Promise<CheckResp> {
  try {
    if (!TWILIO_VERIFY_SERVICE_SID) throw new Error("TWILIO_VERIFY_SERVICE_SID ausente.");
    const url = `${BASE}/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`;
    const body = new URLSearchParams({ To: toE164, Code: code });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data?.message || "Falha ao validar código.", statusCode: res.status };
    }
    // data.status: "approved" quando o código confere
    const approved = data?.status === "approved";
    return { ok: true, status: data?.status, approved };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Erro inesperado ao checar verificação." };
  }
}
