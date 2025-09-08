// src/app/api/otp/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { toE164BR } from "@/lib/phone";
import { startOtpViaVerify } from "@/lib/twilio";
import { getClientIP, limitByKey, checkCooldown, tooMany } from "@/lib/rate-limit";

/**
 * POST /api/otp/start
 * Body: { to | phone | phoneE164 }
 * - Inicia o envio do OTP via Twilio Verify
 */
export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
    }

    const phoneRaw: string | undefined = body?.to ?? body?.phone ?? body?.phoneE164;
    const e164 = phoneRaw ? toE164BR(String(phoneRaw)) : null;
    if (!e164) return NextResponse.json({ error: "Telefone inválido." }, { status: 400 });

    const ip = getClientIP(req);

    {
      const c = checkCooldown(`otp:start:${e164}`, 15);
      if (!c.ok) return tooMany("Aguarde antes de pedir outro código.", c.retryAfterSec);
    }
    {
      const r = limitByKey(`otp:start:${ip}:1m`, 10, 60);
      if (!r.ok) return tooMany("Muitos envios deste IP.", r.retryAfterSec);
    }

    const ok = await startOtpViaVerify(e164);
    if (!ok) return NextResponse.json({ error: "Falha ao iniciar verificação." }, { status: 500 });

    return NextResponse.json({ ok: true, status: "sent" });
  } catch (e) {
    console.error("[api/otp/start] erro:", e);
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}
