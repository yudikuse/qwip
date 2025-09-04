// src/app/api/ads/nonce/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signToken } from "@/lib/signing";
import { verifySessionValue } from "@/lib/session";

function ipFrom(req: NextRequest) {
  const xfwd = req.headers.get("x-forwarded-for");
  return (xfwd?.split(",")[0] || "").trim() || "0.0.0.0";
}

export async function GET(req: NextRequest) {
  try {
    const jar = await cookies();
    const raw = jar.get("qwip_session")?.value || "";
    const session = await verifySessionValue(raw);
    if (!session.ok) {
      return NextResponse.json({ error: "no-session" }, { status: 401 });
    }

    const phone = session.claims.phone;
    const ip = ipFrom(req);
    const ua = req.headers.get("user-agent") || "";

    const now = Math.floor(Date.now() / 1000);
    const exp = now + 60; // nonce curto (60s)

    const token = await signToken({
      sub: "ads",
      path: "/api/ads",
      phone,
      ip,
      ua,
      iat: now,
      exp,
    });

    return NextResponse.json({ nonce: token }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[ads/nonce]", e);
    return NextResponse.json({ error: "nonce failed" }, { status: 500 });
  }
}
