// src/app/api/ads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { moderateImageBase64 } from "@/lib/vision";
import { verifyNonce } from "@/lib/nonce";
import crypto from "crypto";

/** ===== Config ===== */
const EXPIRES_HOURS = 24;
const NONCE_TTL_MS = 120_000; // 120s

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
function sha256Base64url(s: string) {
  return crypto.createHash("sha256").update(s).digest("base64url");
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

  // 2) sessão (cookie)
  const phoneCookie = req.cookies.get("qwip_phone_e164")?.value || "";
  if (!phoneCookie) {
    return NextResponse.json({ ok: false, error: "Telefone não verificado." }, { status: 401 });
  }

  // 3) nonce HMAC (gerado em /api/ads/nonce com src/lib/nonce.ts)
  const nonce = req.headers.get("x-qwip-nonce") || "";
  if (!nonce) {
    return NextResponse.json({ ok: false, error: "Requisição sem nonce." }, { status: 400 });
  }

  const ver = verifyNonce(nonce);
  if (!ver.ok) {
    const reason = ver.reason === "secret" ? "server" : ver.reason;
    return NextResponse.json({ ok: false, error: `Nonce inválido (${reason}).` }, { status: 401 });
  }

  // valida conteúdo do payload do nonce
  const ua = req.headers.get("user-agent") || "";
  const now = Date.now();
  const payload = ver.payload || {};
  const phoneInNonce: string | undefined = payload.sub; // telefone
  const ts: number | undefined = payload.ts;
  const ipInNonce: string | undefined = payload.ip;
  const uaHashInNonce: string | undefined = payload.ua;

  if (!phoneInNonce || phoneInNonce !== phoneCookie) {
    return NextResponse.json({ ok: false, error: "Nonce não confere (telefone)." }, { status: 401 });
  }
  if (typeof ts !== "number" || now - ts > NONCE_TTL_MS) {
    return NextResponse.json({ ok: false, error: "Nonce expirado." }, { status: 401 });
  }
  const uaHashNow = sha256Base64url(ua || "unknown");
  if (uaHashInNonce && uaHashInNonce !== uaHashNow) {
    return NextResponse.json({ ok: false, error: "Nonce não confere (UA)." }, { status: 401 });
  }
  // IP pode variar em provedores móveis/CDN; aqui só checamos se veio e diverge — opcional bloquear:
  if (ipInNonce && ipInNonce !== ip) {
    // Para MVP, apenas rejeitamos para endurecer:
    return NextResponse.json({ ok: false, error: "Nonce não confere (IP)." }, { status: 401 });
    // Alternativa mais branda: apenas logar e permitir.
  }

  // 4) payload do anúncio
  let json: any = {};
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }

  const imageBase64 = String(json?.imageBase64 || "");
  const title = String(json?.title ?? "").trim();
  const description = String(json?.description ?? "").trim();
  const priceCents = Number(json?.priceCents ?? 0) || 0;
  const city = json?.city ? String(json.city).trim() : null;
  const uf = json?.uf ? String(json.uf).trim().toUpperCase() : null;

  const lat = Number(json?.lat);
  const lng = Number(json?.lng);
  const centerLat = Number(json?.centerLat);
  const centerLng = Number(json?.centerLng);
  const radiusKm = Number.isFinite(Number(json?.radiusKm)) ? parseInt(String(json.radiusKm), 10) : NaN;

  if (!title || priceCents <= 0) {
    return NextResponse.json({ ok: false, error: "Título e preço são obrigatórios." }, { status: 400 });
  }
  if (![lat, lng, centerLat, centerLng].every((v) => Number.isFinite(v))) {
    return NextResponse.json({ ok: false, error: "Coordenadas geográficas inválidas." }, { status: 400 });
  }
  if (!Number.isFinite(radiusKm) || radiusKm < 1 || radiusKm > 50) {
    return NextResponse.json({ ok: false, error: "Raio inválido (1–50km)." }, { status: 400 });
  }
  if (!imageBase64) {
    return NextResponse.json({ ok: false, error: "Imagem obrigatória." }, { status: 400 });
  }

  // 5) moderação da imagem (Vision)
  try {
    const mod = await moderateImageBase64(imageBase64);
    if (mod.blocked) {
      return NextResponse.json({ ok: false, error: "Imagem reprovada pela moderação automática." }, { status: 400 });
    }
  } catch (e) {
    console.error("[vision]", e);
    // política: falhar fechado no MVP
    return NextResponse.json({ ok: false, error: "Falha ao verificar a imagem. Tente outra." }, { status: 400 });
  }

  // 6) upsert do seller por phoneE164
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

  // 7) cria o anúncio
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
