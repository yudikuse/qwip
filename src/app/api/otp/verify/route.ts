// src/app/api/otp/verify/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { toE164BR } from "@/lib/phone";
import { checkOtpViaVerify } from "@/lib/twilio";
import {
  getClientIP,
  limitByKey,
  checkCooldown,
  tooMany,
} from "@/lib/rate-limit";
import { issueSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    // --------- validação do payload ---------
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
    }

    const phoneRaw: string | undefined = body?.phone ?? body?.phoneE164;
    const code: string | undefined = body?.code;
    const e164 = phoneRaw ? toE164BR(String(phoneRaw)) : null;

    if (!e164 || !code) {
      return NextResponse.json({ ok: false, error: "Dados inválidos." }, { status: 400 });
    }

    // --------- BLINDAGEM (rate limit + cooldown) ---------
    const ip = getClientIP(req);

    // 1) Cooldown por telefone: 10s entre verificações
    {
      const c = checkCooldown(`otp:verify:${e164}`, 10);
      if (!c.ok) return tooMany("Aguarde antes de tentar verificar novamente.", c.retryAfterSec);
    }

    // 2) Tentativas por IP: 15 / 1min
    {
      const r = limitByKey(`otp:verify:${ip}:1m`, 15, 60);
      if (!r.ok) return tooMany("Muitas tentativas deste IP.", r.retryAfterSec);
    }

    // 3) Tentativas por telefone: 5 / 10min
    {
      const r = limitByKey(`otp:verify:${e164}:10m`, 5, 600);
      if (!r.ok) return tooMany("Muitas tentativas para este número.", r.retryAfterSec);
    }

    // --------- Twilio Verify ---------
    const result = await checkOtpViaVerify(e164, code);
    const approved = result?.status === "approved";
    if (!approved) {
      return NextResponse.json(
        { ok: false, error: "Código inválido ou expirado." },
        { status: 401 }
      );
    }

    // --------- Sessão segura + cookie de compat p/ UI ---------
    const sessionValue = await issueSession(e164, 24);
    const res = NextResponse.json({ ok: true, phoneE164: e164 });

    // Sessão segura (HttpOnly, servidor confia)
    res.cookies.set("qwip_session", sessionValue, {
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24, // 24h
    });

    // Cookie legível pela UI (compat) — NÃO usado para auth no servidor
    res.cookies.set("qwip_phone_e164", encodeURIComponent(e164), {
      httpOnly: false,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30d
    });

    return res;
  } catch (err) {
    console.error("[otp/verify]", err);
    return NextResponse.json({ ok: false, error: "Falha ao verificar código." }, { status: 500 });
  }
}
