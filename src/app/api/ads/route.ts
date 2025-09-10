// src/app/api/ads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // ajuste se seu client estiver em outro caminho
import { putImage } from '@/lib/storage';

// =======================
// Moderação (Google Vision) - suporta SDK (Service Account) ou REST (API KEY)
// =======================
import * as vision from '@google-cloud/vision';

// Likelihood map do Vision
const LIKE_MAP = {
  UNKNOWN: 0,
  VERY_UNLIKELY: 1,
  UNLIKELY: 2,
  POSSIBLE: 3,
  LIKELY: 4,
  VERY_LIKELY: 5,
} as const;

type LikelihoodKey = keyof typeof LIKE_MAP;

// Converte "LIKELY" -> 4, etc. (com fallback)
function parseMin(envValue: string | undefined, def: LikelihoodKey): number {
  const key = (envValue ?? def).toUpperCase().trim() as LikelihoodKey;
  return LIKE_MAP[key] ?? LIKE_MAP[def];
}

const STRICT = String(process.env.SAFE_VISION_STRICT).toLowerCase() === 'true';
const DEBUG  = String(process.env.SAFE_VISION_DEBUG).toLowerCase() === 'true';

const MIN_ADULT    = parseMin(process.env.SAFE_VISION_ADULT_MIN, 'LIKELY');      // default: LIKELY
const MIN_VIOLENCE = parseMin(process.env.SAFE_VISION_VIOLENCE_MIN, 'LIKELY');   // default: LIKELY
const MIN_RACY     = parseMin(process.env.SAFE_VISION_RACY_MIN, 'VERY_LIKELY');  // default: VERY_LIKELY

function parseBase64ImageToBuffer(b64: string): Buffer {
  const m = b64.match(/^data:(.+?);base64,(.*)$/);
  const payload = m ? m[2] : b64;
  return Buffer.from(payload, 'base64');
}

// ----- SDK (Service Account) -----
function getVisionClientViaSDK(): vision.ImageAnnotatorClient | null {
  const projectId   = process.env.GCP_PROJECT_ID;
  const clientEmail = process.env.GCP_CLIENT_EMAIL;
  const rawKey      = process.env.GCP_PRIVATE_KEY;
  if (!projectId || !clientEmail || !rawKey) return null;

  const privateKey = rawKey.replace(/\\n/g, '\n');
  return new vision.ImageAnnotatorClient({
    projectId,
    credentials: { client_email: clientEmail, private_key: privateKey },
  });
}

// ----- REST (API KEY) -----
async function safeSearchViaRest(imageBase64: string) {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) return null;

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
    throw new Error(`Vision REST falhou (${res.status}): ${txt || res.statusText}`);
  }

  const json = await res.json();
  const ann = json?.responses?.[0]?.safeSearchAnnotation;
  return ann ?? null;
}

async function moderateOrThrow(imageBase64: string) {
  // 1) Primeiro tenta SDK (se Service Account estiver configurado)
  const sdk = getVisionClientViaSDK();
  if (sdk) {
    const [result] = await sdk.safeSearchDetection({ image: { content: parseBase64ImageToBuffer(imageBase64) } });
    const safe = result?.safeSearchAnnotation;
    if (!safe) {
      if (STRICT) throw new Error('Falha na moderação automática (SDK).');
      if (DEBUG)  console.warn('SAFE_VISION_DEBUG: SDK retornou vazio. Permitindo por STRICT=false.');
      return;
    }
    if (DEBUG) console.log('SAFE_VISION_DEBUG: SDK annotation', safe);
    applyPolicyOrThrow(safe);
    return;
  }

  // 2) Fallback para REST com API KEY
  const ann = await safeSearchOrFailSoft(imageBase64);
  if (ann) applyPolicyOrThrow(ann);
}

async function safeSearchOrFailSoft(imageBase64: string) {
  try {
    const ann = await safeSearchViaRest(imageBase64);
    if (!ann) {
      if (STRICT) throw new Error('Falha na moderação automática (REST).');
      if (DEBUG)  console.warn('SAFE_VISION_DEBUG: REST retornou vazio. Permitindo por STRICT=false.');
      return null;
    }
    if (DEBUG) console.log('SAFE_VISION_DEBUG: REST annotation', ann);
    return ann;
  } catch (e: any) {
    if (STRICT) throw e;
    if (DEBUG)  console.warn('SAFE_VISION_DEBUG: erro na REST', e?.message || e);
    return null;
  }
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
// Fim moderação
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

    // 1) Moderação (fail-closed) – usa SDK ou REST conforme env
    await moderateOrThrow(imageBase64);

    // 2) Persistir imagem no storage
    const stored = await putImage({ base64: imageBase64 });

    // 3) Seller: find-or-create sem UNIQUE (compatível com dados legados)
    let sellerId: string | undefined = undefined;
    if (phoneCookie) {
      const seller = await prisma.$transaction(async (tx) => {
        const found = await tx.seller.findFirst({
          where: { phone: phoneCookie }, // mapeado p/ phoneE164 no schema
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

    // 4) Criar o anúncio com todos os campos requeridos + imagem
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
