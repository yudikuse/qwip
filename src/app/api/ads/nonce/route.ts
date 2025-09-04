// src/app/api/ads/nonce/route.ts
export const runtime = "nodejs"; // cookies() síncrono + crypto nativo

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signToken } from "@/lib/signing";

function ipFrom(req: NextRequest) {
  const xfwd = req.headers.get("x-forwarded-for");
  return (xfwd?.split(",")[0] || "").trim() || "0.0.0.0";
}

export async function GET(req: NextRequest) {
  try {
    const jar = cookies(); // síncrono em runtime nodejs
    const phone = jar.get("qwip_phone_e164")?.value;

    if (!phone) {
      return NextResponse.json({ error: "not authenticated" }, { status: 401 });
    }

    const ua = req.headers.get("user-agent") || "";
    const ip = ipFrom(req);
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 2 * 60; // 2 minutos

    const nonce = await signToken({
      sub: "ads",
      path: "/api/ads",
      phone,
      ip,
      ua,
      iat,
      exp,
    });

    return NextResponse.json(
      { nonce },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[nonce]", e);
    return NextResponse.json({ error: "nonce failed" }, { status: 500 });
    // Se quiser diagnosticar melhor no cliente, inclua reason:
    // return NextResponse.json({ error: "nonce failed", reason: String(e) }, { status: 500 });
  }
}
