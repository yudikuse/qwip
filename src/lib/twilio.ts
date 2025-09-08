// src/lib/twilio.ts
import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const verifySid = process.env.TWILIO_VERIFY_SID!;

const client = twilio(accountSid, authToken);

type Ok = { ok: true; status: number };
type Fail = { ok: false; status: number; error: string };

export async function sendOtpViaVerify(
  phoneE164: string
): Promise<Ok | Fail> {
  try {
    const resp = await client.verify.v2
      .services(verifySid)
      .verifications.create({ to: phoneE164, channel: "sms" });

    // Twilio retorna status "pending" no envio — consideramos ok
    return { ok: true, status: 200 };
  } catch (e: any) {
    return {
      ok: false,
      status: e?.status ?? 400,
      error: e?.message ?? "Erro no envio do SMS",
    };
  }
}

export async function checkOtpViaVerify(
  phoneE164: string,
  code: string
): Promise<{ status: "approved" | "pending" | "denied" | "expired" } | null> {
  try {
    const check = await client.verify.v2
      .services(verifySid)
      .verificationChecks.create({ to: phoneE164, code });

    // status possíveis: approved | pending
    // Para fins de fluxo, tratamos qualquer diferente de "approved" como falha
    return { status: (check.status as any) ?? "pending" };
  } catch (e) {
    return null;
  }
}
