// src/app/api/ads/nonce/route.ts
// Retorna um NONCE curto assinado para proteger o POST /api/ads.
// Entrega o token em: JSON { ok:true, token }, Header "X-Qwip-Nonce" e Cookie httpOnly.
// Exige sessão válida.

import { NextRequest, NextResponse } from "next/server";
import { verifySessionValue } from "@/lib/session";
import { signToken } from "@/lib/signing";
import { setNonceCookie } from "@/lib/nonce";

export const dynamic = "force-dynamic";

function ipFrom(req: NextRequest) {
  const xfwd = req.headers.get("x-forwarded-for");
  return (xfwd?.split(",")[0] || "").trim() || "0.0.0.0";
}

export async function GET(req: NextRequest) {
  // 1) Sessão via cookie
  const raw = req.cookies.get("qwip_session")?.value ?? null;
  const session = await verifySessionValue(raw);
  if (!session.ok || !session.claims) {
    const res = NextResponse.json({ ok: false, error: "Sessão inválida/expirada." }, { status: 401 });
    // ainda assim envia um nonce “descartável” p/ evitar quebra dura no client
    const now = Math.floor(Date.now() / 1000);
    const dummy = await signToken({
      sub: "ads",
      path: "/api/ads",
      phone: "",
      ip: ipFrom(req),
      ua: req.headers.get("user-agent") || "",
      iat: now,
      exp: now + 30,
    });
    res.headers.set("X-Qwip-Nonce", dummy);
    setNonceCookie(res, dummy, 30);
    return res;
  }

  // 2) Claims do NONCE (compatíveis com lib/signing.ts)
  const now = Math.floor(Date.now() / 1000);
  const token = await signToken({
    sub: "ads",
    path: "/api/ads",
    phone: session.claims.phone,
    ip: ipFrom(req),
    ua: req.headers.get("user-agent") || "",
    iat: now,
    exp: now + 60, // TTL curto evita replay
  });

  // 3) JSON inclui token (para o front atual), e também setamos Header + Cookie
  const res = NextResponse.json({ ok: true, token }, { status: 200, headers: { "Cache-Control": "no-store" } });
  res.headers.set("X-Qwip-Nonce", token);
  setNonceCookie(res, token, 60);
  return res;
}
