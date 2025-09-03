import { NextResponse } from "next/server";
import { toE164BR } from "@/lib/phone";
import { checkOtpViaVerify } from "@/lib/twilio";

/**
 * Espera { to: string, code: string }
 * - to: telefone em qualquer formato BR; normalizamos para E.164
 * - code: código recebido por SMS
 *
 * Respostas:
 * 200 { status: "approved", valid: true, phoneE164: "+55..." }  -> seta cookie
 * 200 { status: "...",       valid: false }                      -> código incorreto/expirado
 * 400 { error: "..." }                                          -> dados inválidos/erro
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawTo = (body?.to ?? body?.phone ?? "") as string;
    const code = (body?.code ?? "") as string;

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

    // Código aprovado -> seta cookie igual à /api/otp/verify
    const res = NextResponse.json({
      status: result.status,
      valid: true,
      phoneE164: e164,
    });

    res.headers.set(
      "Set-Cookie",
      `qwip_phone_e164=${encodeURIComponent(e164)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax; Secure`
    );

    return res;
  } catch (err) {
    console.error("[otp/check]", err);
    return NextResponse.json({ error: "Falha ao verificar código." }, { status: 400 });
  }
}
