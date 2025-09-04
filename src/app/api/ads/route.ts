// src/app/api/ads/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySessionValue } from "@/lib/session";
import { verifyToken } from "@/lib/signing";
import { moderateImageBase64 } from "@/lib/vision";

/** ===== Config ===== */
const EXPIRES_HOURS = 24;
// se quiser bloquear quando a moderação falhar, defina SAFE_VISION_STRICT=true no ambiente
const STRICT = process.env.SAFE_VISION_STRICT === "true";

/** ===== Rate-limit (memória; troque por Redis/KV depois) ===== */
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

/** ===== Handler ===== */
export async function POST(req: NextRequest) {
  // 1) rate-limit por IP
  const ip = ipFrom(req);
  const rl = rateByKey(`ads:${ip}:1m`, 5, 60);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Muitas requisições. Tente novamente em instantes.", retryAfterSec: rl.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec), "Cache-Control": "no-store" } }
    );
  }

  // 2) sessão (cookie assinado)
  const rawSession = req.cookies.get("qwip_session")?.value || "";
  const session = await verifySessionValue(rawSession);
  if (!session.ok) {
    return NextResponse.json({ ok: false, error: "Sessão inválida/expirada." }, { status: 401 });
  }
  const phoneCookie = session.claims.phone;

  // 3) nonce/HMAC (proteção adicional por requisição)
  const nonce = req.headers.get("x-qwip-nonce") || "";
  const ua = req.headers.get("user-agent") || "";
  if (!nonce) {
    return NextResponse.json({ ok: false, error: "Requisição sem nonce." }, { status: 400 });
  }

  const ver = await verifyToken(nonce);
  if (!ver.ok) {
    return NextResponse.json({ ok: false, error: `Nonce inválido (${ver.reason}).` }, { status: 401 });
  }
  const c = ver.claims;
  if (c.sub !== "ads" || c.path !== "/api/ads" || c.ip !== ip || c.ua !== ua || c.phone !== phoneCookie) {
    return NextResponse.json({ ok: false, error: "Nonce não confere com a sessão." }, { status: 401 });
  }

  // 4) payload
  let json: any = {};
  try {
    json = await req.json();
  } catch {
    // continua com json vazio para cair nas validações abaixo
  }

  const imageBase64 = String(json?.imageBase64 || "");

  const title = String(json?.title ?? "").trim();
  const description = String(json?.description ?? "").trim();
  const priceCents = Number(json?.priceCents ?? 0) || 0;

  const city = String(json?.city ?? "").trim();
  const uf = String(json?.uf ?? "").trim().toUpperCase();
  const lat = Number(json?.lat ?? 0) || 0;
  const lng = Number(json?.lng ?? 0) || 0;
  const centerLat = Number(json?.centerLat ?? 0) || 0;
  const centerLng = Number(json?.centerLng ?? 0) || 0;
  const radiusKm = Number(json?.radiusKm ?? 0) || 0;

  // 5) validações simples
  if (!title || title.length < 3 || title.length > 120) {
    return NextResponse.json({ ok: false, error: "Título inválido." }, { status: 400 });
  }
  if (description.length > 1000) {
    return NextResponse.json({ ok: false, error: "Descrição muito longa." }, { status: 400 });
  }
  if (!Number.isFinite(priceCents) || priceCents < 0 || priceCents > 99_999_99) {
    return NextResponse.json({ ok: false, error: "Preço inválido." }, { status: 400 });
  }
  if (!city || uf.length !== 2) {
    return NextResponse.json({ ok: false, error: "Localidade inválida." }, { status: 400 });
  }
  if (![lat, lng, centerLat, centerLng, radiusKm].every(Number.isFinite)) {
    return NextResponse.json({ ok: false, error: "Coordenadas inválidas." }, { status: 400 });
  }

  // 6) moderação da imagem (quando enviada)
  if (imageBase64) {
    try {
      const safe = await moderateImageBase64(imageBase64);
      if (!safe && STRICT) {
        return NextResponse.json({ ok: false, error: "Imagem reprovada pela moderação." }, { status: 400 });
      }
      // se não for estrito, apenas logamos e seguimos
      if (!safe) console.warn("[ads/moderation] imagem sinalizada, seguindo por não estrito");
    } catch (err) {
      console.error("[ads/moderation]", err);
      if (STRICT) {
        return NextResponse.json({ ok: false, error: "Falha na moderação da imagem." }, { status: 400 });
      }
    }
  }

  // 7) garantir seller (vincula ao telefone da sessão)
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

  // 8) cria o anúncio
  const expiresAt = new Date(Date.now() + EXPIRES_HOURS * 60 * 60 * 1000);
  try {
    const ad = await prisma.ad.create({
      data: {
        title,
        description,
        priceCents,
        city,
        uf,
        lat,
        lng,
        centerLat,
        centerLng,
        radiusKm,
        expiresAt,
        sellerId,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: ad.id }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[ads/create]", err);
    return NextResponse.json({ ok: false, error: "Falha ao criar anúncio." }, { status: 500 });
  }
}
