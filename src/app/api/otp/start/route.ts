import { NextRequest, NextResponse } from "next/server";
import { toE164BR } from "@/lib/phone";
import { getClientIP, tooMany, checkCooldown, startCooldown } from "@/lib/rate-limit";
import { startOtpViaVerify, type StartResp } from "@/lib/twilio";

export async function POST(req: NextRequest) {
  const { phone } = await req.json().catch(() => ({ phone: "" as string }));
  const e164 = toE164BR(String(phone || ""));

  if (!e164) {
    return NextResponse.json(
      { ok: false, error: "Telefone inválido.", status: 400 } as StartResp,
      { status: 400 }
    );
  }

  const ip = getClientIP(req);
  const abuseKey = `otp:abuse:${ip}`;
  const phoneKey = `otp:cooldown:${e164}`;

  if (await tooMany(abuseKey)) {
    return NextResponse.json(
      { ok: false, error: "Muitas tentativas. Tente novamente mais tarde.", status: 429 } as StartResp,
      { status: 429 }
    );
  }

  // Cooldown de 30s por número
  if (checkCooldown(phoneKey, 30_000)) {
    return NextResponse.json(
      { ok: false, error: "Aguarde alguns segundos para reenviar.", status: 429 } as StartResp,
      { status: 429 }
    );
  }

  const tw = await startOtpViaVerify(e164);
  if (!tw.ok) {
    return NextResponse.json(
      { ok: false, error: tw.error || "Erro ao enviar código.", status: tw.status || 500 } as StartResp,
      { status: tw.status || 500 }
    );
  }

  // Inicia cooldown para esse número
  startCooldown(phoneKey, 30_000);

  const res = NextResponse.json(
    { ok: true, phoneE164: e164, status: 200 } as StartResp,
    { status: 200 }
  );

  // Cookie com o telefone para a etapa de checagem (5 minutos)
  res.cookies.set("otp_phone", e164, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: 60 * 5,
  });

  return res;
}
