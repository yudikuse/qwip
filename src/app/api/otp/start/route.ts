import { NextRequest, NextResponse } from "next/server";
import { toE164BR } from "@/lib/phone";
import { sendOtpViaVerify } from "@/lib/twilio";
import {
  getClientIP,
  limitByKey,
  checkCooldown,
  tooMany,
} from "@/lib/rate-limit";

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
      return NextResponse.json({ ok: false, error: "Telefone inválido." }, { status: 400 });
    }

    const ip = getClientIP(req);
    {
      const c = checkCooldown(`otp:start:${e164}`, 10);
      if (!c.ok) return tooMany("Aguarde antes de pedir outro código.", c.retryAfterSec);
    }
    {
      const r = limitByKey(`otp:start:${ip}:1m`, 15, 60);
      if (!r.ok) return tooMany("Muitas tentativas deste IP.", r.retryAfterSec);
    }
    {
      const r = limitByKey(`otp:start:${e164}:10m`, 5, 600);
      if (!r.ok) return tooMany("Muitas tentativas para este número.", r.retryAfterSec);
    }

    const ok = await sendOtpViaVerify(e164);
    if (!ok) {
      return NextResponse.json({ ok: false, error: "Falha ao enviar código." }, { status: 500 });
    }

    // Cookie temporário (5 min) para o /api/otp/check usar como fallback
    const res = NextResponse.json({ ok: true, phoneE164: e164 });
    res.cookies.set("qwip_otp_phone", e164, {
      path: "/",
      maxAge: 60 * 5,
      sameSite: "lax",
      secure: true,
      httpOnly: true,
    });
    return res;
  } catch (err) {
    console.error("[api/otp/start]", err);
    return NextResponse.json({ ok: false, error: "Falha ao iniciar verificação." }, { status: 500 });
  }
}
