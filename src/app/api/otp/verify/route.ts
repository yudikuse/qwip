// src/app/api/otp/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { toE164BR } from "@/lib/phone";
import { checkOtpViaVerify } from "@/lib/twilio";
import { PHONE_COOKIE } from "@/lib/cookies";

type VerifyResp =
  | { ok: true; phoneE164: string }
  | { ok: false; status: number; error?: string };

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json();
    const e164 = toE164BR(phone);
    if (!e164 || !code) {
      return NextResponse.json(
        { ok: false, status: 400, error: "Dados inválidos." } satisfies VerifyResp,
        { status: 400 }
      );
    }

    const result = await checkOtpViaVerify(e164, code);
    if (!result.ok || result.verifyStatus !== "approved") {
      return NextResponse.json(
        { ok: false, status: 400, error: "Código inválido ou expirado." } satisfies VerifyResp,
        { status: 400 }
      );
    }

    const res = NextResponse.json(
      { ok: true, phoneE164: e164 } satisfies VerifyResp,
      { status: 200 }
    );

    res.cookies.set(PHONE_COOKIE, e164, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return res;
  } catch {
    return NextResponse.json(
      { ok: false, status: 500, error: "Erro ao verificar código." } satisfies VerifyResp,
      { status: 500 }
    );
  }
}
