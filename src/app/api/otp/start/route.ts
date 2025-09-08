// src/app/api/otp/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { toE164BR } from "@/lib/phone";
import { startOtpViaVerify } from "@/lib/twilio";
import { getClientIP, limitByKey, checkCooldown, tooMany } from "@/lib/rate-limit";

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
    if (!e164) return NextResponse.json({ ok: false, error: "Telefone inválido." }, { status: 400 });

    const ip = getClientIP(req);
    {
      const c = checkCooldown(`otp:start:${e164}`, 10);
      if (!c.ok) return tooMany("Aguarde antes de pedir outro código.", c.retryAfterSec);
    }
    {
      const r = limitByKey(`otp:start:${ip}:1m`, 12, 60);
      if (!r.ok) return tooMany("Muitas tentativas deste IP.", r.retryAfterSec);
    }
    {
      const r = limitByKey(`otp:start:${e164}:30m`, 5, 1800);
      if (!r.ok) return tooMany("Muitas tentativas para este número.", r.retryAfterSec);
    }

    const sent = await startOtpViaVerify(e164);
    return NextResponse.json({ ok: true, status: sent.status });
  } catch (err) {
    console.error("[api/otp/start]", err);
    return NextResponse.json({ ok: false, error: "Falha ao iniciar OTP." }, { status: 500 });
  }
}
