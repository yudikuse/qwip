// src/app/api/otp/start/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toE164BR } from "@/lib/phone";
import { sendOtpSms } from "@/lib/twilio";
import crypto from "crypto";

const TTL_MINUTES = 10;

function hashCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function generateCode(): string {
  // 6 dígitos, sem 000000
  let n = Math.floor(100000 + Math.random() * 900000);
  return String(n);
}

export async function POST(req: Request) {
  try {
    const { phone } = (await req.json()) as { phone?: string };
    const e164 = phone ? toE164BR(phone) : null;
    if (!e164) {
      return NextResponse.json({ ok: false, error: "Telefone inválido." }, { status: 400 });
    }

    // Apaga sessões antigas desse número (mantém simples e sem unique)
    await prisma.otpSession.deleteMany({ where: { phoneE164: e164 } });

    const code = generateCode();
    const codeHash = hashCode(code);
    const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000);

    await prisma.otpSession.create({
      data: {
        phoneE164: e164,
        codeHash,
        expiresAt,
        attempts: 0,
        verified: false,
      },
    });

    // Envia SMS
    await sendOtpSms(e164, code);

    return NextResponse.json({
      ok: true,
      phoneE164: e164,
      ttlSeconds: TTL_MINUTES * 60,
    });
  } catch (err: any) {
    console.error("[otp/start]", err);
    return NextResponse.json({ ok: false, error: "Falha ao iniciar OTP." }, { status: 500 });
  }
}
