import { NextRequest, NextResponse } from "next/server";
import { toE164BR } from "@/lib/phone";
import { checkOtpViaVerify } from "@/lib/twilio";
import { getClientIP, limitByKey, checkCooldown, tooMany } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
    }

    const phoneRaw: string | undefined = body?.phone ?? body?.phoneE164 ?? body?.to;
    const code: string | undefined = body?.code;
    const e164 = phoneRaw ? toE164BR(String(phoneRaw)) : null;

    if (!e164 || !code) {
      return NextResponse.json({ ok: false, error: "Dados inválidos." }, { status: 400 });
    }

    // rate limit / cooldown
    const ip = getClientIP(req);
    if (!checkCooldown(`otp:verify:${e164}`, 10).ok) {
      return tooMany("Aguarde antes de tentar verificar novamente.", 10);
    }
    if (!limitByKey(`otp:verify:${ip}:1m`, 15, 60).ok) {
      return tooMany("Muitas tentativas deste IP.", 60);
    }
    if (!limitByKey(`otp:verify:${e164}:10m`, 5, 600).ok
