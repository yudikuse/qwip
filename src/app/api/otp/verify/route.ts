// src/app/api/otp/verify/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { toE164BR } from "@/lib/phone";
import { checkOtpViaVerify } from "@/lib/twilio";
import { getClientIP, limitByKey, checkCooldown, tooMany } from "@/lib/rate-limit";

// Mesmo segredo e cookie que o middleware usa
const COOKIE_NAME = "qwip_session";
const SIGNING_SECRET =
  process.env.SIGNING_SECRET ||
  process.env.QWIP_SIGNING_SECRET ||
  "dev-secret-change-me";

// utils (Edge-safe)
function b64url(bytes: Uint8Array) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function hmacSha256(key: string, data: string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const kBuf = new ArrayBuffer(enc.encode(key).byteLength);
  new Uint8Array(kBuf).set(enc.encode(key));
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    kBuf,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const dBuf = new ArrayBuffer(enc.encode(data).byteLength);
  new Uint8Array(dBuf).set(enc.encode(data));
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, dBuf);
  return new Uint8Array(sig);
}

export async function POST(req: NextRequest) {
  try {
    // --------- payload ---------
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
    }

    // aceitamos { phone, code } | { phoneE164, code } | { to, code }
    const phoneRaw: string | undefined = body?.phone ?? body?.phoneE164 ?? body?.to;
    const code: string | undefined = body?.code;
    const e164 = phoneRaw ? toE164BR(String(phoneRaw)) : null;

    if (!e164 || !code) {
      return NextResponse.json({ ok: false, error: "Dados inválidos." }, { status: 400 });
    }

    // --------- Rate limit / cooldown ---------
    const ip = getClientIP(req);

    // 1) Cooldown por telefone: 10s
    {
      const c = checkCooldown(`otp:verify:${e164}`, 10);
      if (!c.ok) return tooMany("Aguarde antes de tentar verificar novamente.", c.retryAfterSec);
    }

    // 2) Tentativas por IP: 15 / 1min
    {
      const r = limitByKey(`otp:verify:${ip}:1m`, 15, 60);
      if (!r.ok) return tooMany("Muitas tentativas deste IP.", r.retryAfterSec);
    }

    // 3) Tentativas por telefone: 5 / 10min
    {
      const r = limitByKey(`otp:verify:${e164}:10m`, 5, 600);
      if (!r.ok) return tooMany("Muitas tentativas para este número.", r.retryAfterSec);
    }

    // --------- Twilio Verify ---------
    const result = await checkOtpViaVerify(e164, code);
    const approved = result?.status === "approved";
    if (!approved) {
      return NextResponse.json(
        { ok: false, error: "Código inválido ou expirado." },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    // --------- Emite token compatível com o middleware (v1.<payload>.<sig>) ---------
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 60 * 60 * 24; // 24h
    const payload = { phone: e164, iat, exp };
    const payloadStr = JSON.stringify(payload);
    const payloadB64 = b64url(new TextEncoder().encode(payloadStr));
    const toSign = `v1.${payloadB64}`;
    const sig = await hmacSha256(SIGNING_SECRET, toSign);
    const token = `v1.${payloadB64}.${b64url(sig)}`;

    const res = NextResponse.json(
      { ok: true, phoneE164: e164 },
      { headers: { "Cache-Control": "no-store" } }
    );

    // Cookie HttpOnly lido pelo middleware
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax", // compat com redirects cross-path
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24, // 24h
      // NÃO definir "domain" para evitar incompatibilidade em previews/subdomínios
    });

    // (Opcional) cookie legível pela UI
    res.cookies.set("qwip_phone_e164", encodeURIComponent(e164), {
      httpOnly: false,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30d
    });

    return res;
  } catch (err) {
    console.error("[otp/verify]", err);
    return NextResponse.json({ ok: false, error: "Falha ao verificar código." }, { status: 500 });
  }
}
