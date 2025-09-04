// src/app/api/ads/nonce/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signNonce } from "@/lib/nonce";
import crypto from "crypto";

export const runtime = "nodejs"; // garante Node (hash via 'crypto')

// util: pega IP do cliente
function ipFrom(req: NextRequest) {
  const xfwd = req.headers.get("x-forwarded-for");
  return (xfwd?.split(",")[0] || "").trim() || "0.0.0.0";
}

// util: SHA-256 base64url
function sha256Base64url(s: string) {
  return crypto.createHash("sha256").update(s).digest("base64url");
}

export async function GET(req: NextRequest) {
  try {
    const jar = await cookies(); // <<< AGORA É 'await'
    const phone = jar.get("qwip_phone_e164")?.value;

    if (!phone) {
      return NextResponse.json({ error: "not authenticated" }, { status: 401 });
    }

    const ua = req.headers.get("user-agent") || "unknown";
    const ip = ipFrom(req);
    const uaHash = sha256Base64url(ua);

    const payload = {
      sub: phone,       // telefone (confere com cookie no /api/ads)
      ts: Date.now(),   // timestamp para TTL
      ip,               // IP visto no momento da emissão
      ua: uaHash,       // hash do user-agent
    };

    const nonce = signNonce(payload);

    return NextResponse.json(
      { ok: true, nonce },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[ads/nonce]", e);
    return NextResponse.json({ error: "nonce failed" }, { status: 500 });
  }
}
