// src/lib/twilio.ts
import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
const authToken = process.env.TWILIO_AUTH_TOKEN || "";
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID || "";

/**
 * Canal padrão:
 * - defina TWILIO_DEFAULT_CHANNEL = 'sms' ou 'whatsapp' no Vercel
 * - se não definir, cai para 'sms'
 */
const envDefault = (process.env.TWILIO_DEFAULT_CHANNEL || "sms").toLowerCase();
const defaultChannel: "sms" | "whatsapp" =
  envDefault === "whatsapp" ? "whatsapp" : "sms";

// O client do Twilio só funciona no runtime Node (rotas /api/ com route.ts).
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

function ensureConfig() {
  if (!client || !verifyServiceSid) {
    throw new Error(
      "Twilio Verify não configurado. Defina TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_VERIFY_SERVICE_SID."
    );
  }
}

/**
 * Dispara o envio do OTP via Twilio Verify.
 * @param toE164 Ex.: +5511999998888
 * @param channel 'sms' | 'whatsapp' (opcional, padrão vem de env)
 */
export async function startOtpViaVerify(
  toE164: string,
  channel: "sms" | "whatsapp" = defaultChannel
): Promise<boolean> {
  try {
    ensureConfig();
    const r = await client!
      .verify.v2.services(verifyServiceSid)
      .verifications.create({ to: toE164, channel });
    // status esperado: 'pending'
    return !!r?.sid;
  } catch (e) {
    console.error("[twilio] startOtpViaVerify error:", e);
    return false;
  }
}

/**
 * Checa o código informado.
 * Retorna o objeto do Twilio com 'status' (aprovado = 'approved').
 */
export async function checkOtpViaVerify(
  toE164: string,
  code: string
): Promise<{ status?: string }> {
  try {
    ensureConfig();
    const r = await client!
      .verify.v2.services(verifyServiceSid)
      .verificationChecks.create({ to: toE164, code });
    return { status: r?.status };
  } catch (e) {
    console.error("[twilio] checkOtpViaVerify error:", e);
    return { status: undefined };
  }
}
