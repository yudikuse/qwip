// src/app/api/ads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/signing";

/** rate-limit simples em memória (substituir por Redis/KV em produção multi-região) */
const buckets = new Map<string, { c: number; reset: number }>();
function rateByKey(key: string, limit: number, windowSec: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { c: 1, reset: now + windowSec * 1000 });
    return { ok: true, remaining: limit - 1, retryAfterSec: 0 };
  }
  if (b.c >= limit) return { ok: false, remaining: 0, retryAfterSec: Math.ceil((b.reset - now)/1000) };
  b.c += 1;
  return { ok: true, remaining: limit - b.c, retryAfterSec: 0 };
}
function ipFrom(req: NextRequest) {
  const xfwd = req.headers.get("x-forwarded-for");
  return (xfwd?.split(",")[0] || "").trim() || "0.0.0.0";
}

export async function POST(req: NextRequest) {
  // 1) rate-limit por IP (5 por minuto)
  const ip = ipFrom(req);
  const rl = rateByKey(`ads:${ip}:1m`, 5, 60);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Muitas requisições. Tente novamente em instantes.", retryAfterSec: rl.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec), "Cache-Control": "no-store" } }
    );
  }

  // 2) cookie obrigatório (sessão verificada via OTP)
  const phoneCookie = req.cookies.get("qwip_phone_e164")?.value || "";
  if (!phoneCookie) {
    return NextResponse.json({ ok: false, error: "Telefone não verificado." }, { status: 401 });
  }

  // 3) validação de nonce/HMAC
  const nonce = req.headers.get("x-qwip-nonce") || "";
  const ua = req.headers.get("user-agent") || "";
  if (!nonce) {
    // modo estrito: bloqueia; (se quiser modo transição, troque para 400 e header X-QWIP-Warn)
    return NextResponse.json({ ok: false, error: "Requisição sem nonce." }, { status: 400 });
  }
  const ver = verifyToken(nonce);
  if (!ver.ok) {
    return NextResponse.json({ ok: false, error: `Nonce inválido (${ver.reason}).` }, { status: 401 });
  }
  const c = ver.claims;
  if (c.sub !== "ads" || c.path !== "/api/ads" || c.phone !== phoneCookie || c.ip !== ip || c.ua !== ua) {
    return NextResponse.json({ ok: false, error: "Nonce não confere com a sessão." }, { status: 401 });
  }

  // 4) valida payload
  let json: any = {};
  try { json = await req.json(); } catch {}
  const data = {
    title: (json?.title ?? "").trim(),
    description: (json?.description ?? "").trim(),
    priceCents: Number(json?.priceCents ?? 0) || 0,
    city: (json?.city ?? "").trim(),
    uf: (json?.uf ?? "").trim().toUpperCase(),
    lat: json?.lat ?? null,
    lng: json?.lng ?? null,
    centerLat: json?.centerLat ?? null,
    centerLng: json?.centerLng ?? null,
    radiusKm: Number(json?.radiusKm ?? 5) || 5,
    phoneE164: phoneCookie,
  };

  if (!data.title || data.priceCents <= 0) {
    return NextResponse.json({ ok: false, error: "Dados inválidos." }, { status: 400 });
  }

  // 5) cria no banco (ajuste conforme seu schema)
  try {
    const ad = await prisma.ad.create({
      data: {
        title: data.title,
        description: data.description,
        priceCents: data.priceCents,
        city: data.city,
        uf: data.uf,
        lat: data.lat,
        lng: data.lng,
        centerLat: data.centerLat,
        centerLng: data.centerLng,
        radiusKm: data.radiusKm,
        phoneE164: data.phoneE164,
        // ...outros campos do seu schema
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: ad.id }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[ads/create]", err);
    return NextResponse.json({ ok: false, error: "Falha ao criar anúncio." }, { status: 500 });
  }
}
