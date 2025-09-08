// src/lib/twilio.ts
import Twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID!;

const client = Twilio(accountSid, authToken);

export type VerifyStartResult = { sid: string; status: string };
export type VerifyCheckResult = { sid: string; status: string };

export async function startOtpViaVerify(toE164: string): Promise<VerifyStartResult> {
  const v = await client.verify.v2
    .services(verifyServiceSid)
    .verifications.create({ to: toE164, channel: "sms" });

  return { sid: v.sid, status: v.status ?? "pending" };
}

export async function checkOtpViaVerify(toE164: string, code: string): Promise<VerifyCheckResult> {
  const c = await client.verify.v2
    .services(verifyServiceSid)
    .verificationChecks.create({ to: toE164, code });

  return { sid: c.sid, status: c.status ?? "pending" };
}
