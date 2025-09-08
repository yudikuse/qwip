// src/app/api/otp/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { toE164BR } from "@/lib/phone";
import { checkOtpViaVerify } from "@/lib/twilio";
import { getClientIP, limitByKey, checkCooldown, tooMany } from "@/lib/rate-limit";

/**
 * POST /api/otp/verify
 * Body: { to | phone | phoneE164, code }
 * - Verifica OTP (Twilio Verify)
 * - Se aprovado, grava cookie legível no client (30 dias)
 */
export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
    }

    const phoneRaw: string | undefined = body?.to ?? body?.phone ?? body?.phoneE164;
    const code: string | undefined = body?.code;
    const e164 = phoneRaw ? toE164BR(String(phoneRaw)) : null;

    if (!e164 || !code) {
      return NextResponse.json({ ok: false, error: "Dados inválidos." }, { status: 400 });
    }

    const ip = getClientIP(req);
    {
      const c = checkCooldown(`otp:verify:${e164}`, 10);
      if (!c.ok) return tooMany("Aguarde antes de tentar verificar novamente.", c.retryAfterSec);
    }
    {
      const r = limitByKey(`otp:verify:${ip}:1m`, 15, 60);
      if (!r.ok) return tooMany("Muitas tentativas deste IP.", r.retryAfterSec);
    }
    {
      const r = limitByKey(`otp:verify:${e164}:10m`, 5, 600);
      if (!r.ok) return tooMany("Muitas tentativas para este número.", r.retryAfterSec);
    }

    const result = await checkOtpViaVerify(e164, code);
    if (result?.status !== "approved") {
      return NextResponse.json(
        { ok: false, error: "Código inválido ou expirado." },
        { status: 401 }
      );
    }

    // cookie visível ao client (para middleware e páginas client)
    const res = NextResponse.json({ ok: true, phoneE164: e164 });
    res.cookies.set("qwip_phone_e164", e164, {
      path: "/",
      sameSite: "lax",
      secure: true,
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (err) {
    console.error("[api/otp/verify]", err);
    return NextResponse.json({ ok: false, error: "Falha ao verificar código." }, { status: 500 });
  }
}
