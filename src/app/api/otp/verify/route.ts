// src/app/api/otp/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { toE164BR } from "@/lib/phone";
import { checkOtpViaVerify } from "@/lib/twilio";
import { getClientIP, limitByKey, checkCooldown, tooMany } from "@/lib/rate-limit";

/**
 * POST /api/otp/verify
 * Body: { phone | phoneE164 | to, code }
 * Valida via Twilio Verify e grava cookie visível ao client.
 */
export async function POST(req: NextRequest) {
  try {
    // Body
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
    }

    const phoneRaw: string | undefined = body?.phone ?? body?.phoneE164 ?? body?.to;
    const code: string | undefined = body?.code;
    const e164 = phoneRaw ? toE164BR(String(phoneRaw)) : null;

    if (!e164 || !code) {
      return NextResponse.json({ ok: false, error: "Dados inválidos." }, { status: 400 });
    }

    // Rate limit / cooldown
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
      // 👇 AQUI estava faltando o parêntese de fechamento
      const r = limitByKey(`otp:verify:${e164}:10m`, 5, 600);
      if (!r.ok) return tooMany("Muitas tentativas para este número.", r.retryAfterSec);
    }

    // Twilio Verify
    const result = await checkOtpViaVerify(e164, code);
    if (result?.status !== "approved") {
      return NextResponse.json(
        { ok: false, error: "Código inválido ou expirado." },
        { status: 401 }
      );
    }

    // Cookie por 30 dias (lido pelo middleware)
    const res = NextResponse.json({ ok: true, phoneE164: e164 });
    res.headers.set(
      "Set-Cookie",
      `qwip_phone_e164=${encodeURIComponent(e164)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax; Secure`
    );
    return res;
  } catch (err) {
    console.error("[api/otp/verify] erro:", err);
    return NextResponse.json({ ok: false, error: "Falha ao verificar código." }, { status: 500 });
  }
}
