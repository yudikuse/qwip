// src/app/api/otp/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { toE164BR } from "@/lib/phone";
import { startOtpViaVerify } from "@/lib/twilio";
import { getClientIP, limitByKey, checkCooldown, tooMany } from "@/lib/rate-limit";

/**
 * Inicia o envio do OTP via Twilio Verify.
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

    const raw: string | undefined = body?.phone ?? body?.phoneE164 ?? body?.to;
    const e164 = raw ? toE164BR(String(raw)) : null;
    if (!e164) {
      return NextResponse.json({ ok: false, error: "Número inválido." }, { status: 400 });
    }

    const ip = getClientIP(req);

    // Cooldown e limites
    {
      const c = checkCooldown(`otp:start:${e164}`, 15);
      if (!c.ok) return tooMany("Aguarde antes de solicitar novamente.", c.retryAfterSec);
    }
    {
      const r = limitByKey(`otp:start:${ip}:1m`, 12, 60);
      if (!r.ok) return tooMany("Muitas solicitações deste IP.", r.retryAfterSec);
    }
    {
      const r = limitByKey(`otp:start:${e164}:10m`, 5, 600);
      if (!r.ok) return tooMany("Muitas solicitações para este número.", r.retryAfterSec);
    }

    const resp = await startOtpViaVerify(e164);
    if ("error" in resp) {
      return NextResponse.json({ ok: false, error: resp.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, status: resp.status });
  } catch (err) {
    console.error("[api/otp/start]", err);
    return NextResponse.json({ ok: false, error: "Falha ao iniciar verificação." }, { status: 500 });
  }
}
