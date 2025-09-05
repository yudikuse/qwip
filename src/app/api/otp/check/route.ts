import { NextRequest, NextResponse } from "next/server";
import { toE164BR } from "@/lib/phone";
import { checkOtpViaVerify } from "@/lib/twilio";
import { getClientIP, limitByKey, checkCooldown, tooMany } from "@/lib/rate-limit";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    // --------- validação do payload ---------
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
    }

    const jar = await cookies();
    const cookiePhone = jar.get("qwip_otp_phone")?.value;

    // Aceita os nomes usados no client atual
    const phoneRaw: string | undefined =
      body?.phone ?? body?.phoneE164 ?? body?.to ?? cookiePhone;

    const code: string | undefined = body?.code ?? body?.otp;
    const e164 = phoneRaw ? toE164BR(String(phoneRaw)) : null;

    if (!e164 || !code) {
      return NextResponse.json({ ok: false, error: "Dados inválidos." }, { status: 400 });
    }

    // --------- BLINDAGEM (rate limit + cooldown) ---------
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

    // --------- Twilio Verify ---------
    const result = await checkOtpViaVerify(e164, code);
    const approved = result?.status === "approved";
    if (!approved) {
      return NextResponse.json(
        { ok: false, error: "Código inválido ou expirado." },
        { status: 401 }
      );
    }

    // --------- Cookies ---------
    const res = NextResponse.json({ ok: true, phoneE164: e164 });

    // apaga o temporário
    res.cookies.set("qwip_otp_phone", "", {
      path: "/",
      maxAge: 0,
      sameSite: "lax",
      secure: true,
      httpOnly: true,
    });

    // mantém o cookie de UI (lido pelo middleware) por 30 dias
    res.cookies.set("qwip_phone_e164", e164, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      secure: true,
      httpOnly: false, // deixe visível, como no fluxo original
    });

    return res;
  } catch (err) {
    console.error("[otp/check]", err);
    return NextResponse.json({ ok: false, error: "Falha ao verificar código." }, { status: 500 });
  }
}
