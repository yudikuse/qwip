// src/app/api/ads/[id]/route.ts
import { NextResponse, type RouteContext } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/ads/:id
 * Retorna um anúncio por id.
 *
 * Nota: assinatura corrigida para Next 15:
 *   GET(req: Request, ctx: RouteContext<{ id: string }>)
 */
export async function GET(req: Request, ctx: RouteContext<{ id: string }>) {
  try {
    const id = ctx.params?.id;
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
        imageUrl: true, // coluna de imagem — usar a coluna do seu schema
        createdAt: true,
      },
    });

    if (!ad) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ ad });
  } catch (err) {
    console.error("GET /api/ads/[id] error:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
