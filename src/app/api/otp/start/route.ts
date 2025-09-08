// src/app/api/otp/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { toE164BR } from "@/lib/phone";
import { getClientIP, tooMany } from "@/lib/rate-limit";
import { sendOtpViaVerify } from "@/lib/twilio";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    const ip = getClientIP(req);
    if (await tooMany(ip)) {
      return NextResponse.json(
        { ok: false, error: "Muitas tentativas. Tente novamente mais tarde.", status: 429 },
        { status: 429 }
      );
    }

    const e164 = toE164BR(phone);
    const sent = await sendOtpViaVerify(e164);

    if (!sent.ok) {
      return NextResponse.json(
        { ok: false, error: sent.error ?? "Falha ao enviar código.", status: sent.status ?? 400 },
        { status: sent.status ?? 400 }
      );
    }

    return NextResponse.json(
      { ok: true, phoneE164: e164, status: 200 },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "Erro ao iniciar verificação.", status: 500 },
      { status: 500 }
    );
  }
}
