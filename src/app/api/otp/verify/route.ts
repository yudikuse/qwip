// src/app/api/otp/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { toE164BR } from "@/lib/phone";
import { checkOtpViaVerify } from "@/lib/twilio";
import { getClientIP, limitByKey, checkCooldown, tooMany } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // payload
    const body = await req.json().catch(() => null);
    const phoneRaw: string | undefined = body?.phone ?? body?.phoneE164 ?? body?.to;
    const code: string | undefined = body?.code ? String(body.code) : undefined;
    const e164 = phoneRaw ? toE164BR(String(phoneRaw)) : null;

    if (!e164 || !code) {
      return NextResponse.json({ ok: false, error: "Dados inválidos." }, { status: 400 });
    }

    // rate limits
    {
      const c = checkCooldown(`otp:verify:${e164}`, 10);
      if (!c.ok) return tooMany("Aguarde antes de tentar verificar novamente.", c.retryAfterSec);
    }
    {
      const ip = getClientIP(req);
      const r = limitByKey(`otp:verify:${ip}:1m`, 15, 60);
      if (!r.ok) return tooMany("Muitas tentativas deste IP.", r.retryAfterSec);
    }
    {
      const r = limitByKey(`otp:verify:${e164}:10m`, 5, 600);
      if (!r.ok) return tooMany("Muitas tentativas para este número.", r.retryAfterSec);
    }

    // valida com Twilio Verify
    const result = await checkOtpViaVerify(e164, code);
    const approved = (result as any)?.status === "approved";
    if (!approved) {
      return NextResponse.json(
        { ok: false, error: "Código inválido ou expirado." },
        { status: 401 }
      );
    }

    // responde e GRAVA o cookie usando a API oficial do Next
    const res = NextResponse.json({ ok: true, phoneE164: e164 });
    res.cookies.set({
      name: "qwip_phone_e164",
      value: encodeURIComponent(e164),
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: "/",
      sameSite: "lax",
      secure: true,
      httpOnly: true, // cliente não precisa ler; middleware lê normalmente
    });
    return res;
  } catch (err) {
    console.error("[api/otp/verify] Erro:", err);
    return NextResponse.json({ ok: false, error: "Falha ao verificar código." }, { status: 500 });
  }
}
