// src/app/api/otp/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { toE164BR } from "@/lib/phone";
import { startOtpViaVerify } from "@/lib/twilio";
import { getClientIP, limitByKey, checkCooldown, tooMany } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const { to } = await req.json();
    const e164 = to ? toE164BR(String(to)) : null;
    if (!e164) return NextResponse.json({ error: "Telefone inválido." }, { status: 400 });

    const ip = getClientIP(req);

    {
      const c = checkCooldown(`otp:start:${e164}`, 15);
      if (!c.ok) return tooMany("Aguarde antes de pedir outro código.", c.retryAfterSec);
    }
    {
      const r = limitByKey(`otp:start:${ip}:1m`, 10, 60);
      if (!r.ok) return tooMany("Muitos envios deste IP.", r.retryAfterSec);
    }

    const ok = await startOtpViaVerify(e164);
    if (!ok) return NextResponse.json({ error: "Falha ao iniciar verificação." }, { status: 500 });

    return NextResponse.json({ ok: true, status: "sent" });
  } catch (e) {
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}
