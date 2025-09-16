import { NextRequest, NextResponse } from "next/server";
import { toE164BR } from "@/lib/phone";
import { sendOtpViaVerify } from "@/lib/twilio";
import {
  getClientIP,
  limitByKey,
  checkCooldown,
  dailyCap,
  tooMany,
} from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // --------- validação do payload ---------
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
    }

    const phoneRaw: string | undefined = body?.phone ?? body?.phoneE164;
    const e164 = phoneRaw ? toE164BR(String(phoneRaw)) : null;

    if (!e164) {
      return NextResponse.json({ ok: false, error: "Telefone inválido." }, { status: 400 });
    }

    // --------- BLINDAGEM (rate limit + cooldown) ---------
    const ip = getClientIP(req);

    // 1) Rajada por IP: 3 req / 60s
    {
      const r = limitByKey(`otp:start:${ip}:1m`, 3, 60);
      if (!r.ok) return tooMany("Espere antes de tentar novamente (IP/1m).", r.retryAfterSec);
    }

    // 2) Janela maior por IP: 10 req / 10min
    {
      const r = limitByKey(`otp:start:${ip}:10m`, 10, 600);
      if (!r.ok) return tooMany("Muitas tentativas deste IP.", r.retryAfterSec);
    }

    // 3) Cooldown por telefone: 60s entre envios
    {
      const c = checkCooldown(`otp:start:${e164}`, 60);
      if (!c.ok) return tooMany("Aguarde antes de solicitar outro código.", c.retryAfterSec);
    }

    // 4) Teto diário por telefone: 10/dia
    {
      const d = dailyCap(e164, 10);
      if (!d.ok) return tooMany("Limite diário de códigos atingido para este número.", 3600);
    }

    // --------- Twilio Verify ---------
    await sendOtpViaVerify(e164);

    return NextResponse.json({ ok: true, phoneE164: e164 });
  } catch (err) {
    console.error("[otp/start]", err);
    return NextResponse.json({ ok: false, error: "Falha ao enviar SMS." }, { status: 500 });
  }
}
