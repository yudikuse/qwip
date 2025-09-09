// src/app/api/ads/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySessionValue } from "@/lib/session";
import { verifyToken } from "@/lib/signing";
import { moderateImageBase64 } from "@/lib/vision";

/** ===== Config ===== */
const EXPIRES_HOURS = 24;
// Para falhas do Vision: se quiser "fail-closed", defina SAFE_VISION_STRICT=true
const STRICT = process.env.SAFE_VISION_STRICT === "true";

/** ===== Rate-limit (em memória; substitua por Redis/KV depois) ===== */
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

  // 2) sessão
  const raw = req.cookies.get("qwip_session")?.value ?? null;
  const session = await verifySessionValue(raw);
  if (!session.ok || !session.claims) {
    return NextResponse.json({ ok: false, error: "Sessão inválida/expirada." }, { status: 401 });
  }
  const phoneCookie = session.claims.phone;

  // 3) nonce/HMAC da requisição
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
  try { json = await req.json(); } catch {}

  const imageBase64 = String(json?.imageBase64 || "");

  const title = String(json?.title ?? "").trim();
  const description = String(json?.description ?? "").trim();
  const priceCents = Number.isFinite(json?.priceCents) ? Number(json.priceCents) : 0;

  const city = json?.city ? String(json.city).trim() : null;
  const uf = json?.uf ? String(json.uf).trim() : null;

  // >>> Campos de localização: obrigatórios (o seu Prisma exige number, não aceita null)
  if (json?.lat == null || json?.lng == null || json?.centerLat == null || json?.centerLng == null) {
    return NextResponse.json(
      { ok: false, error: "Localização obrigatória (lat/lng/centerLat/centerLng)." },
      { status: 400 }
    );
  }

  const lat = Number(json.lat);
  const lng = Number(json.lng);
  const centerLat = Number(json.centerLat);
  const centerLng = Number(json.centerLng);
  const radiusKm = json?.radiusKm == null ? 5 : Math.max(1, Math.min(50, Number(json.radiusKm)));

  // 5) validações básicas
  if (!title || !description || !priceCents || priceCents < 0) {
    return NextResponse.json({ ok: false, error: "Dados obrigatórios inválidos." }, { status: 400 });
  }
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return NextResponse.json({ ok: false, error: "Latitude inválida." }, { status: 400 });
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return NextResponse.json({ ok: false, error: "Longitude inválida." }, { status: 400 });
  }
  if (!Number.isFinite(centerLat) || centerLat < -90 || centerLat > 90) {
    return NextResponse.json({ ok: false, error: "centerLat inválido." }, { status: 400 });
  }
  if (!Number.isFinite(centerLng) || centerLng < -180 || centerLng > 180) {
    return NextResponse.json({ ok: false, error: "centerLng inválido." }, { status: 400 });
  }

  // 6) moderação da imagem (quando enviada)
  if (imageBase64) {
    try {
      const mod = await moderateImageBase64(imageBase64);
      if (mod.blocked) {
        return NextResponse.json(
          { ok: false, code: "image_blocked", reason: mod.reason ?? "blocked" },
          { status: 422, headers: { "Cache-Control": "no-store" } }
        );
      }
    } catch (err) {
      console.error("[ads/moderation]", err);
      if (STRICT) {
        return NextResponse.json(
          { ok: false, code: "moderation_failed", error: "Falha na moderação da imagem." },
          { status: 400, headers: { "Cache-Control": "no-store" } }
        );
      }
      // modo não-estrito: segue mesmo com falha de moderação
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

  // 8) cria o anúncio (tudo como number — sem null)
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
