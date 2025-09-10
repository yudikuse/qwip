// src/app/api/ads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { putImage } from '@/lib/storage';

// ====== Config SAFE ======
const LIKE_MAP = { UNKNOWN:0, VERY_UNLIKELY:1, UNLIKELY:2, POSSIBLE:3, LIKELY:4, VERY_LIKELY:5 } as const;
type LikelihoodKey = keyof typeof LIKE_MAP;
const STRICT = String(process.env.SAFE_VISION_STRICT).toLowerCase() === 'true';
const DEBUG  = String(process.env.SAFE_VISION_DEBUG).toLowerCase() === 'true';
const PROVIDER = (process.env.SAFE_VISION_PROVIDER || 'rest').toLowerCase();
function parseMin(envValue: string | undefined, def: LikelihoodKey): number {
  const key = (envValue ?? def).toUpperCase().trim() as LikelihoodKey;
  return LIKE_MAP[key] ?? LIKE_MAP[def];
}
const MIN_ADULT    = parseMin(process.env.SAFE_VISION_ADULT_MIN, 'LIKELY');
const MIN_VIOLENCE = parseMin(process.env.SAFE_VISION_VIOLENCE_MIN, 'LIKELY');
const MIN_RACY     = parseMin(process.env.SAFE_VISION_RACY_MIN, 'VERY_LIKELY');

function score(x?: string) { return LIKE_MAP[(x ?? 'UNKNOWN') as LikelihoodKey] ?? 0; }
function applyPolicyOrThrow(safe: any) {
  if (score(safe.adult)    >= MIN_ADULT)    throw new Error('Imagem reprovada (conteúdo adulto).');
  if (score(safe.violence) >= MIN_VIOLENCE) throw new Error('Imagem reprovada (violência).');
  if (score(safe.racy)     >= MIN_RACY)     throw new Error('Imagem reprovada (imprópria).');
}
function parseBase64ImageToBuffer(b64: string): Buffer {
  const m = b64.match(/^data:(.+?);base64,(.*)$/);
  const payload = m ? m[2] : b64;
  return Buffer.from(payload, 'base64');
}
async function safeSearchViaRest(imageBase64: string) {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    const msg = 'Falta GOOGLE_VISION_API_KEY';
    if (STRICT) throw new Error(msg);
    if (DEBUG) console.warn('SAFE_VISION_DEBUG:', msg, 'Permitindo por STRICT=false.');
    return null;
  }
  const body = { requests: [{ image: { content: parseBase64ImageToBuffer(imageBase64).toString('base64') }, features: [{ type: 'SAFE_SEARCH_DETECTION' }] }] };
  const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(()=>'');
    const errMsg = `Vision REST falhou (${res.status}): ${txt || res.statusText}`;
    if (STRICT) throw new Error(errMsg);
    if (DEBUG) console.warn('SAFE_VISION_DEBUG:', errMsg, 'Permitindo por STRICT=false.');
    return null;
  }
  const json = await res.json();
  return json?.responses?.[0]?.safeSearchAnnotation ?? null;
}
async function moderateOrThrow(imageBase64: string) {
  const useRest = PROVIDER === 'rest' || PROVIDER === 'google' || PROVIDER === '';
  const ann = await safeSearchViaRest(imageBase64);
  if (!ann) return;
  applyPolicyOrThrow(ann);
}

// ====== POST /api/ads (criar) ======
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title, description, priceCents, imageBase64,
      city, uf, lat, lng,
      centerLat = null, centerLng = null, radiusKm = null,
      expiresAt = null,
    } = body ?? {};

    if (!title || !description || typeof priceCents !== 'number' ||
        !imageBase64 || !city || !uf || typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    const phoneCookie = req.cookies.get('seller_phone')?.value ?? null;

    await moderateOrThrow(imageBase64);

    const stored = await putImage({ base64: imageBase64 });

    let sellerId: string | undefined = undefined;
    if (phoneCookie) {
      const seller = await prisma.$transaction(async (tx) => {
        const found = await tx.seller.findFirst({ where: { phone: phoneCookie }, select: { id: true } });
        if (found) return found;
        return tx.seller.create({ data: { phone: phoneCookie }, select: { id: true } });
      });
      sellerId = seller.id;
    }

    const ad = await prisma.ad.create({
      data: {
        title, description, priceCents,
        city, uf, lat, lng,
        centerLat: centerLat ?? undefined,
        centerLng: centerLng ?? undefined,
        radiusKm: radiusKm ?? undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        imageUrl: stored.url,
        imageMime: stored.mime,
        imageSha256: stored.sha256,
        sellerId,
      },
      select: { id: true },
    });

    return NextResponse.json({ id: ad.id }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/ads error:', err);
    const msg = typeof err?.message === 'string' ? err.message : 'Não foi possível criar o anúncio.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

// ====== GET /api/ads (listar) ======
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const take = Math.min(parseInt(searchParams.get('take') ?? '12', 10) || 12, 50);
    const cursor = searchParams.get('cursor') ?? undefined;

    const ads = await prisma.ad.findMany({
      take: take + 1, // pegar 1 extra para saber se tem próxima página
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, title: true, priceCents: true,
        city: true, uf: true,
        imageUrl: true, createdAt: true,
      },
    });

    const hasNext = ads.length > take;
    const items = hasNext ? ads.slice(0, take) : ads;
    const nextCursor = hasNext ? items[items.length - 1].id : null;

    return NextResponse.json({ items, nextCursor }, { status: 200 });
  } catch (e: any) {
    console.error('GET /api/ads error:', e);
    return NextResponse.json({ error: 'Falha ao listar anúncios' }, { status: 500 });
  }
}
