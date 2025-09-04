// src/app/api/otp/check/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { toE164BR } from "@/lib/phone";
import { checkOtpViaVerify } from "@/lib/twilio";
import { issueSession } from "@/lib/session";

/**
 * Espera { to: string, code: string }
 * - to: telefone em qualquer formato BR; normalizamos para E.164
 * - code: código recebido por SMS
 *
 * Respostas:
 * 200 { status: "approved", valid: true, phoneE164: "+55..." }  -> seta cookies (sessão + UI)
 * 200 { status: "...",       valid: false }                      -> código incorreto/expirado
 * 400 { error: "..." }                                          -> dados inválidos/erro
 */
export async function POST(req: Request) {
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
      // mantém contrato atual: status + valid=false
      return NextResponse.json(
        { status: result?.status ?? "unverified", valid: false },
        { status: 200 }
      );
    }

    // --------- OTP aprovado -> setar cookies ---------
    // 1) Sessão segura (HttpOnly) que o servidor confia
    const sessionValue = await issueSession(e164, 24);

    // 2) Cookie legível pela UI (compat com fluxo atual) — NÃO é usado para autenticação no servidor
    const uiCookie = `qwip_phone_e164=${encodeURIComponent(e164)}; Path=/; Max-Age=${
      60 * 60 * 24 * 30
    }; SameSite=Lax; Secure`;

    // Resposta igual ao contrato existente
    const res = NextResponse.json({
      status: result.status,
      valid: true,
      phoneE164: e164,
    });

    // Zera qualquer cookie antigo e aplica o de UI novamente
    res.headers.append(
      "Set-Cookie",
      "qwip_phone_e164=; Path=/; Max-Age=0; SameSite=Lax; Secure"
    );
    res.headers.append("Set-Cookie", uiCookie);

    // Cookie de sessão (HttpOnly, Secure, Strict, 24h)
    res.cookies.set("qwip_session", sessionValue, {
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24, // 24h
    });

    return res;
  } catch (err) {
    console.error("[otp/check]", err);
    return NextResponse.json(
      { error: "Falha ao verificar código." },
      { status: 400 }
    );
  }
}
