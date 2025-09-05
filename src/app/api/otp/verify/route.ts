// src/app/api/otp/verify/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { toE164BR } from "@/lib/phone";
import { checkOtpViaVerify } from "@/lib/twilio";
import { getClientIP, limitByKey, checkCooldown, tooMany } from "@/lib/rate-limit";
import { issueSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const phoneRaw: string | undefined = body?.phone ?? body?.phoneE164;
    const code: string | undefined = body?.code;
    const e164 = phoneRaw ? toE164BR(String(phoneRaw)) : null;

    if (!e164 || !code) {
      return NextResponse.json({ ok: false, error: "Dados inválidos." }, { status: 400 });
    }

    const ip = getClientIP(req);
    const c1 = checkCooldown(`otp:verify:${e164}`, 10); if (!c1.ok) return tooMany("Aguarde antes de tentar verificar novamente.", c1.retryAfterSec);
    const r1 = limitByKey(`otp:verify:${ip}:1m`, 15, 60); if (!r1.ok) return tooMany("Muitas tentativas deste IP.", r1.retryAfterSec);
    const r2 = limitByKey(`otp:verify:${e164}:10m`, 5, 600); if (!r2.ok) return tooMany("Muitas tentativas para este número.", r2.retryAfterSec);

    const result = await checkOtpViaVerify(e164, code);
    const approved = result?.status === "approved";
    if (!approved) {
      return NextResponse.json({ ok: false, error: "Código inválido ou expirado." }, { status: 401 });
    }

    const sessionValue = await issueSession(e164, 24);
    const res = NextResponse.json({ ok: true, phoneE164: e164 });

    res.cookies.set("qwip_session", sessionValue, {
      httpOnly: true, sameSite: "strict", secure: true, path: "/", maxAge: 60 * 60 * 24,
    });
    res.cookies.set("qwip_phone_e164", encodeURIComponent(e164), {
      httpOnly: false, sameSite: "lax", secure: true, path: "/", maxAge: 60 * 60 * 24 * 30,
    });

    return res;
  } catch (err) {
    console.error("[otp/verify]", err);
    return NextResponse.json({ ok: false, error: "Falha ao verificar código." }, { status: 500 });
  }
}
