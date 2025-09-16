// src/app/api/ads/[id]/route.ts
/**
 * GET /api/ads/:id
 * Retorna um anúncio pelo ID.
 * Compatível com Next.js 15 (sem RouteContext).
 */
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    }

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
        imageMime: true,
        createdAt: true,
        // Se no seu schema existir relação com vendedor e telefone, você pode expor aqui:
        // seller: { select: { phoneE164: true } },
      },
    });

    if (!ad) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // Normalização simples para o front
    const payload = {
      ...ad,
      // expiresAt = 24h após criação
      expiresAt: new Date(ad.createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      // sellerPhone: ad.seller?.phoneE164 ?? null, // descomente se tiver no schema
    };

    return NextResponse.json({ ad: payload });
  } catch (err) {
    console.error("[/api/ads/:id][GET] error:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
