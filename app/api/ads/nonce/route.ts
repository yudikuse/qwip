// app/api/ads/nonce/route.ts
import { NextRequest, NextResponse } from "next/server";
import { signClaims } from "@/lib/signing";
import { getClientIP } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  // precisa estar logado por telefone
  const phone = req.cookies.get("qwip_phone_e164")?.value || "";
  if (!phone) {
    return NextResponse.json({ ok: false, error: "Não autenticado por telefone." }, { status: 401 });
  }

  const ip = getClientIP(req);
  const ua = req.headers.get("user-agent") || "";
  const now = Math.floor(Date.now() / 1000);

  const token = signClaims({
    sub: "ads",
    phone,
    ip,
    ua,
    path: "/api/ads",
    iat: now,
    exp: now + 120, // 2 minutos de validade
  });

  return NextResponse.json({ ok: true, nonce: token }, { headers: { "Cache-Control": "no-store" } });
}
