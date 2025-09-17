// src/app/api/ads/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Next 15: o contexto tem params síncrono (não é Promise).
 * Assinatura correta da Route Handler:
 *   (req: Request, ctx: { params: { id: string }})
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    // Use SELECT (sem INCLUDE) para evitar conflitos de tipo do Prisma
    const ad = await prisma.ad.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        priceCents: true,
        city: true,
        uf: true,
        lat: true,
        lng: true,
        centerLat: true,
        centerLng: true,
        radiusKm: true,
        imageUrl: true,
        createdAt: true,
        expiresAt: true,

        // Pega os possíveis campos do vendedor. Nomes cobrem variações comuns.
        seller: {
          select: {
            // troque os nomes abaixo caso na sua tabela sejam diferentes:
            phoneE164: true as any,      // se não existir, o Prisma ignora em runtime
            phone: true as any,
            whatsapp: true as any,
            isPhoneVerified: true as any,
            phoneVerifiedAt: true as any,
          },
        },
      },
    });

    if (!ad) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    // Normaliza o telefone: usa o que existir (E.164 preferido) e mantém apenas dígitos
    const rawPhone =
      (ad.seller as any)?.phoneE164 ??
      (ad.seller as any)?.phone ??
      (ad.seller as any)?.whatsapp ??
      null;

    let sellerPhone: string | null = null;
    if (rawPhone) {
      const digits = String(rawPhone).replace(/\D/g, "");
      // remove prefixo "00" caso venha assim, mantém "55..." etc.
      const norm = digits.startsWith("00") ? digits.slice(2) : digits;
      if (norm.length >= 10) sellerPhone = norm;
    }

    // Monte o payload final esperado pelo front
    const payload = {
      id: ad.id,
      title: ad.title,
      description: ad.description,
      priceCents: ad.priceCents,
      city: ad.city,
      uf: ad.uf,
      lat: ad.lat,
      lng: ad.lng,
      centerLat: ad.centerLat,
      centerLng: ad.centerLng,
      radiusKm: ad.radiusKm,
      imageUrl: ad.imageUrl,
      createdAt: ad.createdAt?.toISOString?.() ?? ad.createdAt,
      expiresAt: (ad.expiresAt as any)?.toISOString?.() ?? ad.expiresAt ?? null,

      // *** campo crítico p/ abrir chat direto no WhatsApp ***
      sellerPhone, // ex.: "556499945XXXX"
    };

    return NextResponse.json({ ok: true, ad: payload });
  } catch (err) {
    console.error("[GET /api/ads/:id] error:", err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
