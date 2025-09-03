// src/lib/twilio.ts
import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
const authToken  = process.env.TWILIO_AUTH_TOKEN  || "";
const verifySid  = process.env.TWILIO_VERIFY_SERVICE_SID || ""; // << NOVA ENV

// Twilio v4: cliente é criado com função, NÃO com "new"
export const twilioClient = (accountSid && authToken) ? twilio(accountSid, authToken) : null;

export async function sendOtpViaVerify(toE164: string) {
  if (!twilioClient || !verifySid) throw new Error("Twilio Verify não configurado");
  return twilioClient.verify.v2
    .services(verifySid)
    .verifications
    .create({ to: toE164, channel: "sms" });
}

export async function checkOtpViaVerify(toE164: string, code: string) {
  if (!twilioClient || !verifySid) throw new Error("Twilio Verify não configurado");
  return twilioClient.verify.v2
    .services(verifySid)
    .verificationChecks
    .create({ to: toE164, code });
}

