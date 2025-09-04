// src/app/api/ads/nonce/route.ts
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import crypto from "crypto";
import { signNonce } from "@/lib/nonce";

function sha256Base64url(s: string) {
  return crypto.createHash("sha256").update(s).digest("base64url");
}

export async function POST() {
  try {
    const jar = cookies();
    const phone = jar.get("qwip_phone_e164")?.value;

    if (!phone) {
      return NextResponse.json({ error: "not authenticated" }, { status: 401 });
    }

    if (!process.env.QWIP_NONCE_SECRET) {
      return NextResponse.json({ error: "server not configured" }, { status: 500 });
    }

    const h = headers();
    const ua = h.get("user-agent") || "unknown";
    const ip = (h.get("x-forwarded-for") || "").split(",")[0]?.trim() || "0.0.0.0";

    const payload = {
      sub: phone,                 // telefone (do cookie)
      ts: Date.now(),             // timestamp para TTL (validaremos no /api/ads)
      rnd: crypto.randomBytes(8).toString("hex"), // entropia
      ip,                         // IP observado
      ua: sha256Base64url(ua),    // hash do user-agent (não expõe UA em claro)
      v: 1                        // versão do formato
    };

    const nonce = signNonce(payload);
    return NextResponse.json({ nonce }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
