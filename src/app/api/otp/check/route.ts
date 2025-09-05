// src/app/api/otp/check/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { toE164BR } from "@/lib/phone";
import { checkOtpViaVerify } from "@/lib/twilio";
import { issueSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawTo = body?.to;
    const code = String(body?.code ?? "").trim();

    const e164 = toE164BR(rawTo || "");
    if (!e164 || !code) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const result = await checkOtpViaVerify(e164, code);
    const approved = result?.status === "approved";
    if (!approved) {
      return NextResponse.json({ status: result?.status ?? "unverified", valid: false }, { status: 200 });
    }

    const sessionValue = await issueSession(e164, 24);
    const res = NextResponse.json({ status: result.status, valid: true, phoneE164: e164 });

    // Sessão segura (HttpOnly) para o servidor
    res.cookies.set("qwip_session", sessionValue, {
      httpOnly: true, sameSite: "strict", secure: true, path: "/", maxAge: 60 * 60 * 24,
    });
    // Cookie de UI (compat) – é o que sua página verificava
    res.cookies.set("qwip_phone_e164", encodeURIComponent(e164), {
      httpOnly: false, sameSite: "lax", secure: true, path: "/", maxAge: 60 * 60 * 24 * 30,
    });

    return res;
  } catch (err) {
    console.error("[otp/check]", err);
    return NextResponse.json({ error: "Falha ao verificar código." }, { status: 400 });
  }
}
