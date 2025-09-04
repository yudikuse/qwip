// src/app/api/ads/nonce/route.ts
import { NextRequest, NextResponse } from "next/server";
import { signClaims } from "@/lib/signing";

function getIP(req: NextRequest) {
  const xfwd = req.headers.get("x-forwarded-for");
  return (xfwd?.split(",")[0] || "").trim() || "0.0.0.0";
}

export async function GET(req: NextRequest) {
  const phone = req.cookies.get("qwip_phone_e164")?.value || "";
  if (!phone) {
    return NextResponse.json({ ok: false, error: "Sessão não verificada." }, { status: 401 });
  }

  const ip = getIP(req);
  const ua = req.headers.get("user-agent") || "";
  const now = Math.floor(Date.now() / 1000);

  const nonce = signClaims({
    sub: "ads",
    phone,
    ip,
    ua,
    path: "/api/ads",
    iat: now,
    exp: now + 120, // 2 minutos
  });

  return NextResponse.json(
    { ok: true, nonce },
    {
      headers: {
        "Cache-Control": "no-store",
        "Vary": "Cookie, User-Agent, X-Forwarded-For",
      },
    }
  );
}
