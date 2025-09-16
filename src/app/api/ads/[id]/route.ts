// src/app/api/ads/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/ads/:id
 * Retorna um anúncio por id.
 */
export async function GET(
  _req: Request,
  ctx: { params: { id: string } } // <- RouteContext correto no Next 15
) {
  try {
    const id = ctx.params.id;

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
        imageUrl: true, // sua coluna de imagem
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
