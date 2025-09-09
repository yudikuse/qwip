// src/app/api/ads/nonce/route.ts
// Retorna um token curto (nonce) assinado para proteger o POST /api/ads.
// Exige sessão válida (cookie HttpOnly). O cliente recebe o nonce em:
//   Header: X-Qwip-Nonce
//   Cookie: qwip_nonce_sig

import { NextRequest } from "next/server";
import { verifySessionValue } from "@/lib/session";
import { jsonWithNonce } from "@/lib/nonce";

export const dynamic = "force-dynamic";

function ipFrom(req: NextRequest) {
  const xfwd = req.headers.get("x-forwarded-for");
  return (xfwd?.split(",")[0] || "").trim() || "0.0.0.0";
}

export async function GET(req: NextRequest) {
  // 1) Verifica sessão (cookie)
  const raw = req.cookies.get("qwip_session")?.value ?? null;
  const session = await verifySessionValue(raw);
  if (!session.ok || !session.claims) {
    return jsonWithNonce(
      { ok: false, error: "Sessão inválida/expirada." },
      { status: 401, req, claims: { sub: "ads", path: "/api/ads" } }
    );
  }

  // 2) Emite nonce com claims úteis (phone/ip/ua) e TTL curto
  const phone = session.claims.phone;
  return jsonWithNonce(
    { ok: true },
    {
      req,
      ttlSeconds: 60,
      claims: {
        sub: "ads",
        path: "/api/ads",
        phone,
        ip: ipFrom(req),
        ua: req.headers.get("user-agent") || "",
      },
    }
  );
}

