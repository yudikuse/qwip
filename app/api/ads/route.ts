// app/api/ads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getClientIP, limitByKey, tooMany } from "@/lib/rate-limit";

// Endpoint de criação de anúncio (esqueleto).
// Hoje: apenas rate-limit + resposta de OK.
// Próximo passo: ligar o front aqui e exigir nonce/HMAC.

export async function POST(req: NextRequest) {
  // ---- Rate-limit por IP (spam) ----
  const ip = getClientIP(req);
  const r = limitByKey(`ads:create:${ip}:1m`, 5, 60); // 5 req/min/IP
  if (!r.ok) return tooMany("Muitas criações deste IP. Tente depois.", r.retryAfterSec);

  // (Ainda não processa payload — vamos ligar o front aqui no próximo passo)
  return NextResponse.json(
    { ok: true, message: "Endpoint /api/ads pronto (ainda não integrado ao front)." },
    { headers: { "Cache-Control": "no-store", "X-QWIP-Warn": "ads-not-wired" } }
  );
}
