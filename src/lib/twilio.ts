const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_VERIFY_SERVICE_SID,
} = process.env;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
  console.warn("[twilio] Missing TWILIO_* envs");
}

export async function sendOtpViaVerify(e164: string) {
  const basic = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
  const body = new URLSearchParams({ To: e164, Channel: "sms" });

  const resp = await fetch(
    `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`,
    { method: "POST", headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" }, body }
  );

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    return { ok: false as const, status: resp.status, error: text || "Falha no envio." };
  }
  return { ok: true as const, status: 200 };
}

export async function checkOtpViaVerify(e164: string, code: string) {
  const basic = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
  const body = new URLSearchParams({ To: e164, Code: code });

  const resp = await fetch(
    `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`,
    { method: "POST", headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" }, body }
  );

  const json: any = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    return { ok: false as const, status: resp.status, error: json?.message || "Falha na verificação." };
  }
  return { ok: true as const, status: 200, verifyStatus: json?.status as string };
}
