import twilio from "twilio";

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!;
const AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN!;
const VERIFY_SID  = process.env.TWILIO_VERIFY_SID!;

if (!ACCOUNT_SID || !AUTH_TOKEN || !VERIFY_SID) {
  // Deixar claro em runtime de dev/build se faltar configuração
  console.warn("⚠️ TWILIO env vars ausentes. Verifique TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SID.");
}

const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

export type ApiBase = { ok: boolean; status?: number; error?: string };
export type StartResp = ApiBase & { phoneE164?: string };
export type CheckResp = ApiBase & { approved?: boolean };

export async function startOtpViaVerify(phoneE164: string): Promise<StartResp> {
  try {
    const r = await client.verify.v2
      .services(VERIFY_SID)
      .verifications.create({ to: phoneE164, channel: "sms" });

    // Twilio retorna status: "pending" no envio
    return { ok: true, status: 200, phoneE164 };
  } catch (e: any) {
    return {
      ok: false,
      status: Number(e?.status) || 500,
      error: e?.message || "Falha ao iniciar verificação."
    };
  }
}

export async function checkOtpViaVerify(phoneE164: string, code: string): Promise<CheckResp> {
  try {
    const r = await client.verify.v2
      .services(VERIFY_SID)
      .verificationChecks.create({ to: phoneE164, code });

    const approved = r.status === "approved";
    return approved
      ? { ok: true, status: 200, approved: true }
      : { ok: false, status: 400, error: "Código inválido ou expirado.", approved: false };
  } catch (e: any) {
    return {
      ok: false,
      status: Number(e?.status) || 500,
      error: e?.message || "Falha ao validar código.",
    };
  }
}
