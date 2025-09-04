// src/app/api/ads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/signing";

/** ====== Config ====== */
const EXPIRES_HOURS = 24; // ajuste se quiser 48/72h

/** ====== Rate-limit (memória local; troque por Redis/KV em produção multi-régua) ====== */
const buckets = new Map<string, { c: number; reset: number }>();
function rateByKey(key: string, limit: number, windowSec: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { c: 1, reset: now + windowSec * 1000 });
    return { ok: true, remaining: limit - 1, retryAfterSec: 0 };
  }
  if (b.c >= limit) {
    return { ok: false, remaining: 0, retryAfterSec: Math.ceil((b.reset - now) / 1000) };
  }
  b.c += 1;
  return { ok: true, remaining: limit - b.c, retryAfterSec: 0 };
}

function ipFrom(req: NextRequest) {
  const xfwd = req.headers.get("x-forwarded-for");
  return (xfwd?.split(",")[0] || "").trim() || "0.0.0.0";
}

/** ====== Handler ====== */
export async function POST(req: NextRequest) {
  // 1) rate-limit por IP (5/min)
  const ip = ipFrom(req);
  const rl = rateByKey(`ads:${ip}:1m`, 5, 60);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Muitas requisições. Tente novamente em instantes.", retryAfterSec: rl.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec), "Cache-Control": "no-store" } }
    );
  }

  // 2) sessão obrigatória (cookie setado após OTP)
  const phoneCookie = req.cookies.get("qwip_phone_e164")?.value || "";
  if (!phoneCookie) {
    return NextResponse.json({ ok: false, error: "Telefone não verificado." }, { status: 401 });
  }

  // 3) validação de nonce/HMAC (blindagem)
  const nonce = req.headers.get("x-qwip-nonce") || "";
  const ua = req.headers.get("user-agent") || "";
  if (!nonce) {
    return NextResponse.json({ ok: false, error: "Requisição sem nonce." }, { status: 400 });
  }
  const ver = verifyToken(nonce);
  if (!ver.ok) {
    return NextResponse.json({ ok: false, error: `Nonce inválido (${ver.reason}).` }, { status: 401 });
  }
  const c = ver.claims;
  if (c.sub !== "ads" || c.path !== "/api/ads" || c.ip !== ip || c.ua !== ua || c.phone !== phoneCookie) {
    return NextResponse.json({ ok: false, error: "Nonce não confere com a sessão." }, { status: 401 });
  }

  // 4) payload
  let json: any = {};
  try { json = await req.json(); } catch {}

  const title = String(json?.title ?? "").trim();
  const description = String(json?.description ?? "").trim();
  const priceCents = Number(json?.priceCents ?? 0) || 0;
  const city = json?.city ? String(json.city).trim() : null;
  const uf = json?.uf ? String(json.uf).trim().toUpperCase() : null;

  // Campos obrigatórios no seu schema:
  const lat = Number(json?.lat);
  const lng = Number(json?.lng);
  const centerLat = Number(json?.centerLat);
  const centerLng = Number(json?.centerLng);
  const radiusKm = Number.isFinite(Number(json?.radiusKm)) ? parseInt(String(json.radiusKm), 10) : NaN;

  // validações mínimas
  if (!title || priceCents <= 0) {
    return NextResponse.json({ ok: false, error: "Título e preço são obrigatórios." }, { status: 400 });
  }
  if (![lat, lng, centerLat, centerLng].every((v) => Number.isFinite(v))) {
    return NextResponse.json({ ok: false, error: "Coordenadas geográficas inválidas." }, { status: 400 });
  }
  if (!Number.isFinite(radiusKm) || radiusKm < 1 || radiusKm > 200) {
    return NextResponse.json({ ok: false, error: "Raio inválido." }, { status: 400 });
  }

  // 5) upsert do Seller por phoneE164
  let sellerId: string;
  try {
    const seller = await prisma.seller.upsert({
      where: { phoneE164: phoneCookie },
      update: {},
      create: { phoneE164: phoneCookie },
      select: { id: true },
    });
    sellerId = seller.id;
  } catch (err) {
    console.error("[ads/seller-upsert]", err);
    return NextResponse.json({ ok: false, error: "Falha ao registrar vendedor." }, { status: 500 });
  }

  // 6) cria o anúncio (campos exatamente como no seu schema)
  const expiresAt = new Date(Date.now() + EXPIRES_HOURS * 60 * 60 * 1000);

  try {
    const ad = await prisma.ad.create({
      data: {
        title,
        description,
        priceCents,
        city,          // String? → pode ser null
        uf,            // String? → pode ser null
        lat,           // Float
        lng,           // Float
        centerLat,     // Float
        centerLng,     // Float
        radiusKm,      // Int
        expiresAt,     // DateTime
        // isActive default(true)
        sellerId,      // relação obrigatória
      },
      select: { id: true },
    });

    return NextResponse.json(
      { ok: true, id: ad.id },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[ads/create]", err);
    return NextResponse.json({ ok: false, error: "Falha ao criar anúncio." }, { status: 500 });
  }
}
