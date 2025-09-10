// src/app/api/ads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // ajuste se seu client estiver em outro caminho
import { putImage } from '@/lib/storage';

// =======================
// Moderação (Google Vision)
// =======================
import * as vision from '@google-cloud/vision';

// Map de likelihood para número
const likelihoodScore: Record<string, number> = {
  UNKNOWN: 0,
  VERY_UNLIKELY: 1,
  UNLIKELY: 2,
  POSSIBLE: 3,
  LIKELY: 4,
  VERY_LIKELY: 5,
};

// Thresholds conservadores
const BLOCK_THRESHOLD = 4; // LIKELY (4) ou VERY_LIKELY (5) → reprova

function parseBase64ImageToBuffer(b64: string): Buffer {
  const m = b64.match(/^data:(.+?);base64,(.*)$/);
  const payload = m ? m[2] : b64;
  return Buffer.from(payload, 'base64');
}

async function moderateWithVisionOrThrow(imageBase64: string) {
  let client: vision.ImageAnnotatorClient;
  try {
    client = new vision.ImageAnnotatorClient();
  } catch {
    // Se faltar configuração do Vision, falamos claramente
    throw new Error('Configuração do Google Vision ausente ou inválida.');
  }

  const buffer = parseBase64ImageToBuffer(imageBase64);
  const [result] = await client.safeSearchDetection({ image: { content: buffer } });
  const safe = result?.safeSearchAnnotation;

  if (!safe) {
    throw new Error('Falha na moderação automática da imagem.');
  }

  const adult = likelihoodScore[safe.adult ?? 'UNKNOWN'];
  const racy = likelihoodScore[safe.racy ?? 'UNKNOWN'];
  const violence = likelihoodScore[safe.violence ?? 'UNKNOWN'];
  const medical = likelihoodScore[safe.medical ?? 'UNKNOWN'];

  // Bloqueia conteúdos indevidos
  if (adult >= BLOCK_THRESHOLD || racy >= BLOCK_THRESHOLD || violence >= BLOCK_THRESHOLD) {
    throw new Error('Imagem reprovada pela moderação automática.');
  }

  // (Opcional) bloquear medical em casos mais sensíveis:
  if (medical >= 5) {
    throw new Error('Imagem reprovada pela moderação (conteúdo médico sensível).');
  }
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
    await moderateWithVisionOrThrow(imageBase64);

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
