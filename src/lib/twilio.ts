// src/lib/twilio.ts
import Twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_FROM;

if (!accountSid || !authToken || !from) {
  // Não lança erro aqui para não quebrar build; endpoints checam e retornam 500 bonitinho
  console.warn("[twilio] Missing TWILIO_* environment variables.");
}

export const twilioClient =
  accountSid && authToken ? new Twilio(accountSid, authToken) : null;

export async function sendOtpSms(toE164: string, code: string) {
  if (!twilioClient || !from) throw new Error("Twilio not configured");
  await twilioClient.messages.create({
    to: toE164,
    from,
    body: `Seu código Qwip: ${code}. Ele expira em 10 minutos.`,
  });
}
