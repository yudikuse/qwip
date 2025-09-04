// src/app/api/otp/check/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { toE164BR } from "@/lib/phone";
import { checkOtpViaVerify } from "@/lib/twilio";
import { issueSession } from "@/lib/session";

/**
 * Espera { to: string, code: string }
 * - to: telefone BR; normalizamos para E.164
 * - code: código por SMS
 *
 * Respostas:
 * 200 { status: "approved", valid: true, phoneE164 } -> seta cookies (sessão + UI)
 * 200 { status: "...",       valid: false }          -> código incorreto/expirado
 * 400 { error: "..." }                                -> dados inválidos/erro
 */
export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
    }

    const rawTo = body?.to;
    const code = String(body?.code ?? "").trim();

    const e164 = toE164BR(rawTo || "");
    if (!e164 || !code) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const result = await checkOtpViaVerify(e164, code);
    const approved = result?.status === "approved";

    if (!approved) {
      return NextResponse.json(
        { status: result?.status ?? "unverified", valid: false },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }

    // ---- OTP aprovado -> setar cookies (com domínio do host atual) ----
    const sessionValue = await issueSession(e164, 24);
    const res = NextResponse.json(
      { status: result.status, valid: true, phoneE164: e164 },
      { headers: { "Cache-Control": "no-store" } }
    );

    // Descobre o host atual (preview, apex, www, etc.)
    const host = new URL(req.url).hostname;

    // 1) Sessão segura (HttpOnly) – o servidor confia nisto
    res.cookies.set("qwip_session", sessionValue, {
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24, // 24h
      domain: host,
    });

    // 2) Cookie legível pela UI (compat) — NÃO usado para auth no servidor
    res.cookies.set("qwip_phone_e164", encodeURIComponent(e164), {
      httpOnly: false,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30d
      domain: host,
    });

    return res;
  } catch (err) {
    console.error("[otp/check]", err);
    return NextResponse.json({ error: "Falha ao verificar código." }, { status: 400 });
  }
}
