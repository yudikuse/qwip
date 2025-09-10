// src/app/api/ads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { putImage } from '@/lib/storage';

// =======================
// Config de moderação (por env)
// =======================
const LIKE_MAP = {
  UNKNOWN: 0,
  VERY_UNLIKELY: 1,
  UNLIKELY: 2,
  POSSIBLE: 3,
  LIKELY: 4,
  VERY_LIKELY: 5,
} as const;
type LikelihoodKey = keyof typeof LIKE_MAP;

function parseMin(envValue: string | undefined, def: LikelihoodKey): number {
  const key = (envValue ?? def).toUpperCase().trim() as LikelihoodKey;
  return LIKE_MAP[key] ?? LIKE_MAP[def];
}

const STRICT = String(process.env.SAFE_VISION_STRICT).toLowerCase() === 'true';
const DEBUG  = String(process.env.SAFE_VISION_DEBUG).toLowerCase() === 'true';
const PROVIDER = (process.env.SAFE_VISION_PROVIDER || 'rest').toLowerCase(); // 'google' | 'rest' | ''

const MIN_ADULT    = parseMin(process.env.SAFE_VISION_ADULT_MIN, 'LIKELY');
const MIN_VIOLENCE = parseMin(process.env.SAFE_VISION_VIOLENCE_MIN, 'LIKELY');
const MIN_RACY     = parseMin(process.env.SAFE_VISION_RACY_MIN, 'VERY_LIKELY');

// =======================
// Utils
// =======================
function parseBase64ImageToBuffer(b64: string): Buffer {
  const m = b64.match(/^data:(.+?);base64,(.*)$/);
  const payload = m ? m[2] : b64;
  return Buffer.from(payload, 'base64');
}

function score(x?: string): number {
  return LIKE_MAP[(x ?? 'UNKNOWN') as LikelihoodKey] ?? 0;
}

function applyPolicyOrThrow(safe: any) {
  const adult    = score(safe.adult);
  const racy     = score(safe.racy);
  const violence = score(safe.violence);

  if (adult >= MIN_ADULT) {
    throw new Error('Imagem reprovada (conteúdo adulto detectado).');
  }
  if (violence >= MIN_VIOLENCE) {
    throw new Error('Imagem reprovada (violência detectada).');
  }
  if (racy >= MIN_RACY) {
    throw new Error('Imagem reprovada (conteúdo impróprio).');
  }
}

// =======================
// Google Vision (REST via API KEY)
// =======================
async function safeSearchViaRest(imageBase64: string) {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    const msg = 'Falta GOOGLE_VISION_API_KEY nas variáveis do Vercel.';
    if (STRICT) throw new Error(msg);
    if (DEBUG) console.warn('SAFE_VISION_DEBUG:', msg, 'Permitindo por STRICT=false.');
    return null;
  }

  const body = {
    requests: [
      {
        image: { content: parseBase64ImageToBuffer(imageBase64).toString('base64') },
        features: [{ type: 'SAFE_SEARCH_DETECTION' as const }],
      },
    ],
  };

  const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    const errMsg = `Vision REST falhou (${res.status}): ${txt || res.statusText}`;
    if (STRICT) throw new Error(errMsg);
    if (DEBUG) console.warn('SAFE_VISION_DEBUG:', errMsg, 'Permitindo por STRICT=false.');
    return null;
  }

  const json = await res.json();
  const ann = json?.responses?.[0]?.safeSearchAnnotation;
  if (DEBUG) console.log('SAFE_VISION_DEBUG: REST annotation', ann);
  return ann ?? null;
}

async function moderateOrThrow(imageBase64: string) {
  // Só REST/API Key. Aceita 'google' como alias de 'rest'
  const forceRest = PROVIDER === 'rest' || PROVIDER === 'google' || PROVIDER === '';
  if (forceRest) {
    const ann = await safeSearchViaRest(imageBase64);
    if (!ann) return; // já tratamos STRICT/DEBUG dentro da função
    applyPolicyOrThrow(ann);
    return;
  }

  // Qualquer outro valor inesperado → use REST
  const ann = await safeSearchViaRest(imageBase64);
  if (!ann) return;
  applyPolicyOrThrow(ann);
}

// =======================
// Handler
// =======================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      title,
      description,
      priceCents,
      imageBase64,

      // obrigatórios no seu Ad (schema)
      city,
      uf,
      lat,
      lng,

      // opcionais
      centerLat = null,
      centerLng = null,
      radiusKm = null,
      expiresAt = null, // ISO string ou null
    } = body ?? {};

    // Validações mínimas
    if (
      !title ||
      !description ||
      typeof priceCents !== 'number' ||
      !imageBase64 ||
      !city ||
      !uf ||
      typeof lat !== 'number' ||
      typeof lng !== 'number'
    ) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    // Telefone do vendedor via cookie (opcional)
    const phoneCookie = req.cookies.get('seller_phone')?.value ?? null;

    // 1) Moderação (fail-closed)
    await moderateOrThrow(imageBase64);

    // 2) Persistir imagem no storage
    const stored = await putImage({ base64: imageBase64 });

    // 3) Seller: find-or-create sem UNIQUE (compatível com dados legados)
    let sellerId: string | undefined = undefined;
    if (phoneCookie) {
      const seller = await prisma.$transaction(async (tx) => {
        const found = await tx.seller.findFirst({
          where: { phone: phoneCookie }, // mapeado para a coluna phone/phoneE164 do seu schema
          select: { id: true },
        });
        if (found) return found;
        const created = await tx.seller.create({
          data: { phone: phoneCookie },
          select: { id: true },
        });
        return created;
      });
      sellerId = seller.id;
    }

    // 4) Criar o anúncio com todos os campos + imagem
    const ad = await prisma.ad.create({
      data: {
        title,
        description,
        priceCents,
        city,
        uf,
        lat,
        lng,
        centerLat: centerLat ?? undefined,
        centerLng: centerLng ?? undefined,
        radiusKm: radiusKm ?? undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,

        imageUrl: stored.url,
        imageMime: stored.mime,
        imageSha256: stored.sha256,

        sellerId, // pode ser undefined (campo opcional)
      },
      select: { id: true },
    });

    return NextResponse.json({ id: ad.id }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/ads error:', err);
    const msg =
      typeof err?.message === 'string'
        ? err.message
        : 'Não foi possível criar o anúncio.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
