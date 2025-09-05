// src/app/api/ads/nonce/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/signing";
import { verifySessionValue } from "@/lib/session";

function ipFrom(req: NextRequest) {
  const xfwd = req.headers.get("x-forwarded-for");
  return (xfwd?.split(",")[0] || "").trim() || "0.0.0.0";
}

export async function GET(req: NextRequest) {
  try {
    // 1) tenta sessão segura
    const raw = req.cookies.get("qwip_session")?.value || "";
    const session = await verifySessionValue(raw);
    let phone = session.ok ? session.claims.phone : undefined;

    // 2) fallback para cookie de UI (compat)
    if (!phone) {
      const legacy = req.cookies.get("qwip_phone_e164")?.value;
      if (legacy) {
        try { phone = decodeURIComponent(legacy); } catch { phone = legacy; }
      }
    }

    if (!phone) return NextResponse.json({ error: "no-session" }, { status: 401 });

    const ip = ipFrom(req);
    const ua = req.headers.get("user-agent") || "";
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 60;

    const token = await signToken({ sub: "ads", path: "/api/ads", phone, ip, ua, iat: now, exp });
    return NextResponse.json({ nonce: token }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[ads/nonce]", e);
    return NextResponse.json({ error: "nonce failed" }, { status: 500 });
  }
}
