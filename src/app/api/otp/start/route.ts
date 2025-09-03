import { NextResponse } from "next/server";
import { toE164BR } from "@/lib/phone";
import { sendOtpViaVerify } from "@/lib/twilio";

export async function POST(req: Request) {
  try {
    const { phone } = (await req.json()) as { phone?: string };
    const e164 = phone ? toE164BR(phone) : null;

    if (!e164) {
      return NextResponse.json({ ok: false, error: "Telefone inválido." }, { status: 400 });
    }

    await sendOtpViaVerify(e164);
    return NextResponse.json({ ok: true, phoneE164: e164 });
  } catch (err) {
    console.error("[otp/start]", err);
    return NextResponse.json({ ok: false, error: "Falha ao enviar SMS." }, { status: 500 });
  }
}
