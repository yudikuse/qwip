// src/app/api/ads/nonce/route.ts
// Retorna um token curto (nonce) assinado para proteger o POST /api/ads.
// Exige sessão válida (cookie HttpOnly). O cliente deve enviar esse token no header:
//   "x-qwip-nonce: <token>"
//
// Compatível com lib/signing.ts (signToken/verifyToken).

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { verifySessionValue } from "@/lib/session";
import { signToken } from "@/lib/signing";

function ipFrom(req: NextRequest) {
  const xfwd = req.headers.get("x-forwarded-for");
  return (xfwd?.split(",")[0] || "").trim() || "0.0.0.0";
}

export async function GET(req: NextRequest) {
  // 1) Verifica sessão (cookie)
  const raw = req.cookies.get("qwip_session")?.value ?? null;
  const session = await verifySessionValue(raw);
  if (!session.ok || !session.claims) {
    return NextResponse.json({ ok: false, error: "Sessão inválida/expirada." }, { status: 401 });
  }

  // 2) Monta claims do nonce
  const phone = session.claims.phone;
  const ip = ipFrom(req);
  const ua = req.headers.get("user-agent") || "";
  const now = Math.floor(Date.now() / 1000);

  const claims = {
    sub: "ads" as const,
    path: "/api/ads" as const,
    phone,
    ip,
    ua,
    iat: now,
    exp: now + 60, // 60s de validade para evitar replay
  };

  // 3) Assina e devolve
  const token = await signToken(claims);
  return NextResponse.json({ ok: true, token }, { headers: { "Cache-Control": "no-store" } });
}
