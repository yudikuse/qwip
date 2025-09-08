// src/app/api/otp/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { toE164BR } from "@/lib/phone";
import { sendOtpViaVerify } from "@/lib/twilio";

type StartResp =
  | { ok: true; phoneE164: string }
  | { ok: false; status: number; error?: string; cooldown?: number };

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    const e164 = toE164BR(phone);

    if (!e164) {
      return NextResponse.json(
        { ok: false, status: 400, error: "Número inválido." } satisfies StartResp,
        { status: 400 }
      );
    }

    const result = await sendOtpViaVerify(e164);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, status: result.status, error: result.error } satisfies StartResp,
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: true, phoneE164: e164 } satisfies StartResp,
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, status: 500, error: "Erro inesperado ao iniciar o OTP." } satisfies StartResp,
      { status: 500 }
    );
  }
}

// ⚠️ NÃO adicione exports adicionais neste arquivo.
