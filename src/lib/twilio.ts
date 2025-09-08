// src/lib/twilio.ts
import twilio from "twilio";

const {
  TWILIO_ACCOUNT_SID = "",
  TWILIO_AUTH_TOKEN = "",
  TWILIO_VERIFY_SID = "",
  OTP_CHANNEL = "sms", // "sms" ou "whatsapp"
} = process.env;

const client =
  TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
    ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    : null;

type StartResp =
  | { sid: string; status: string }
  | { ok: false; error: string };
type CheckResp =
  | { sid?: string; status?: string; approved?: boolean }
  | { ok: false; error: string };

export async function startOtpViaVerify(toE164: string): Promise<StartResp> {
  if (!client || !TWILIO_VERIFY_SID) {
    // Modo sem Twilio (dev): finge envio
    return { sid: "dev_sid", status: "pending" };
  }
  const r = await client.verify.v2
    .services(TWILIO_VERIFY_SID)
    .verifications.create({
      to: toE164,
      channel: OTP_CHANNEL as "sms" | "whatsapp",
    });
  return { sid: r.sid, status: r.status };
}

export async function checkOtpViaVerify(
  toE164: string,
  code: string
): Promise<CheckResp> {
  if (!client || !TWILIO_VERIFY_SID) {
    // Modo sem Twilio (dev): qualquer "000000" aprova
    const approved = code === "000000";
    return { status: approved ? "approved" : "pending", approved };
  }
  const r = await client.verify.v2
    .services(TWILIO_VERIFY_SID)
    .verificationChecks.create({ to: toE164, code });
  return { sid: r.sid, status: r.status, approved: r.status === "approved" };
}
