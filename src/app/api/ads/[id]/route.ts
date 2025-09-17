// src/app/api/ads/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(_req: Request, ctx: any) {
  try {
    const id: string | undefined = ctx?.params?.id;
    if (!id) {
      return NextResponse.json({ ok: false, error: "MISSING_ID" }, { status: 400 });
    }

    // Buscamos só o necessário p/ página + sellerId/Phone
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
        sellerId: true,
        sellerPhone: true, // preferido (copiado do OTP na criação)
      },
    });

    if (!ad) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    // Fonte única: número verificado do usuário.
    // Preferimos o que já foi copiado para o anúncio; se não existir (legado), buscamos no User.
    let sellerPhone = ad.sellerPhone;
    if (!sellerPhone && ad.sellerId) {
      const user = await prisma.user.findUnique({
        where: { id: ad.sellerId },
        select: { phoneE164: true },
      });
      sellerPhone = user?.phoneE164 ?? null;
    }

    const payload = {
      id: ad.id,
      title: ad.title,
      description: ad.description ?? null,
      priceCents: ad.priceCents ?? 0,
      city: ad.city ?? null,
      uf: ad.uf ?? null,
      lat: ad.lat ?? null,
      lng: ad.lng ?? null,
      centerLat: ad.centerLat ?? null,
      centerLng: ad.centerLng ?? null,
      radiusKm: ad.radiusKm ?? null,
      imageUrl: ad.imageUrl ?? null,
      createdAt: (ad.createdAt as any)?.toISOString?.() ?? ad.createdAt,
      expiresAt: (ad.expiresAt as any)?.toISOString?.() ?? ad.expiresAt ?? null,
      sellerPhone, // <- usado pelo botão WhatsApp
    };

    return NextResponse.json({ ok: true, ad: payload });
  } catch (err) {
    console.error("[GET /api/ads/:id] error:", err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
