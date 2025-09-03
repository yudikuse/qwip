import { NextResponse } from "next/server";
import { toE164BR } from "@/lib/phone";
import { checkOtpViaVerify } from "@/lib/twilio";

export async function POST(req: Request) {
  try {
    const { phone, code } = (await req.json()) as { phone?: string; code?: string };
    const e164 = phone ? toE164BR(phone) : null;

    if (!e164 || !code) {
      return NextResponse.json({ ok: false, error: "Dados inválidos." }, { status: 400 });
    }

    const result = await checkOtpViaVerify(e164, code);
    const approved = result?.status === "approved";
    if (!approved) {
      return NextResponse.json({ ok: false, error: "Código incorreto ou expirado." }, { status: 400 });
    }

    // Opcional: cookie com o E.164 (você já usa localStorage no client)
    const res = NextResponse.json({ ok: true, phoneE164: e164 });
    res.headers.set(
      "Set-Cookie",
      `qwip_phone_e164=${encodeURIComponent(e164)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax; Secure`
    );
    return res;
  } catch (err) {
    console.error("[otp/verify]", err);
    return NextResponse.json({ ok: false, error: "Falha ao verificar código." }, { status: 500 });
  }
}
