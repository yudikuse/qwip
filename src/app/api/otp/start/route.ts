// src/app/api/otp/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { toE164BR } from "@/lib/phone";
import { startOtpViaVerify } from "@/lib/twilio";
import { getClientIP, limitByKey, checkCooldown, tooMany } from "@/lib/rate-limit";

/**
 * Inicia o envio de OTP via Twilio Verify (SMS).
 * Espera: { phone | phoneE164 | to }
 */
export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
    }

    const phoneRaw: string | undefined = body?.phone ?? body?.phoneE164 ?? body?.to;
    const e164 = phoneRaw ? toE164BR(String(phoneRaw)) : null;
    if (!e164) {
      return NextResponse.json({ ok: false, error: "Número inválido." }, { status: 400 });
    }

    // limites & cooldown
    const ip = getClientIP(req);
    {
      const c = checkCooldown(`otp:start:${e164}`, 20);
      if (!c.ok) return tooMany("Aguarde antes de solicitar novo código.", c.retryAfterSec);
    }
    {
      const r = limitByKey(`otp:start:${ip}:1m`, 10, 60);
      if (!r.ok) return tooMany("Muitas tentativas deste IP.", r.retryAfterSec);
    }
    {
      const r = limitByKey(`otp:start:${e164}:10m`, 5, 600);
      if (!r.ok) return tooMany("Muitas tentativas para este número.", r.retryAfterSec);
    }

    const result = await startOtpViaVerify(e164);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error || "Falha ao enviar código." }, { status: 502 });
    }

    // sucesso (status "pending")
    return NextResponse.json({ ok: true, phoneE164: e164, status: result.status || "pending" });
  } catch (err) {
    console.error("[api/otp/start]", err);
    return NextResponse.json({ ok: false, error: "Falha interna ao enviar código." }, { status: 500 });
  }
}
