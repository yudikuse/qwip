// src/app/api/otp/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { toE164BR } from "@/lib/phone";
import { checkOtpViaVerify } from "@/lib/twilio";
import { sign } from "crypto"; // substitua pelo seu JWT util se já tiver

// OBS: troque por sua geração de token real
function makeSessionToken(e164: string) {
  // Exemplo tosco: NÃO USE em produção. Troque por JWT/HMAC próprio.
  // Aqui só para manter compatível com o cookie.
  return Buffer.from(`ok:${e164}:${Date.now()}`).toString("base64url");
}

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json();
    const e164 = toE164BR(phone);

    const result = await checkOtpViaVerify(e164, code);
    const approved = result?.status === "approved";

    if (!approved) {
      return NextResponse.json(
        { ok: false, error: "Código inválido ou expirado.", status: 400 },
        { status: 400 }
      );
    }

    const token = makeSessionToken(e164);

    const res = NextResponse.json({ ok: true, approved: true, status: 200 }, { status: 200 });
    res.cookies.set({
      name: "qwip_auth",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 dias
    });

    return res;
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "Erro ao validar código.", status: 500 },
      { status: 500 }
    );
  }
}
