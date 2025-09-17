// src/app/api/ads/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { onlyDigits } from "@/lib/whatsapp";

const prisma = new PrismaClient();

/**
 * Next 15: não tipar o 2º argumento (ctx) para evitar bug de tipos.
 */
export async function GET(_req: Request, ctx: any) {
  try {
    const id: string | undefined = ctx?.params?.id;
    if (!id) {
      return NextResponse.json({ ok: false, error: "MISSING_ID" }, { status: 400 });
    }

    const ad = await prisma.ad.findUnique({
      where: { id },
      include: {
        seller: true, // precisamos do telefone do vendedor
      },
    });

    if (!ad) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    // Extrai um campo de telefone possível do vendedor
    const rawSellerPhone: string | null =
      // tente campos comuns no seu banco:
      (ad as any)?.seller?.phoneE164 ??
      (ad as any)?.seller?.whatsapp ??
      (ad as any)?.seller?.phone ??
      null;

    // Mantém apenas dígitos e remove "00" inicial (algumas exportações vêm assim)
    let sellerPhone: string | null = null;
    if (rawSellerPhone) {
      const digits = onlyDigits(rawSellerPhone);
      const norm = digits.startsWith("00") ? digits.slice(2) : digits;
      // não prefixo 55 aqui — deixo para o componente/cliente fazer a decisão final,
      // mas já garanto um mínimo de consistência:
      if (norm.length >= 10) sellerPhone = norm;
    }

    const payload = {
      id: ad.id,
      title: ad.title,
      description: ad.description,
      priceCents: ad.priceCents,
      city: ad.city,
      uf: ad.uf,
      lat: ad.lat,
      lng: ad.lng,
      centerLat: (ad as any).centerLat ?? null,
      centerLng: (ad as any).centerLng ?? null,
      radiusKm: (ad as any).radiusKm ?? null,
      imageUrl: (ad as any).imageUrl ?? null,
      createdAt: (ad.createdAt as any)?.toISOString?.() ?? ad.createdAt,
      expiresAt: (ad.expiresAt as any)?.toISOString?.() ?? ad.expiresAt ?? null,
      sellerPhone, // <— crítico pro botão abrir conversa
    };

    return NextResponse.json({ ok: true, ad: payload });
  } catch (err) {
    console.error("[GET /api/ads/:id] error:", err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
