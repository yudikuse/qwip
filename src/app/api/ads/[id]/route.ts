import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/ads/[id]
 * Next.js 15: o segundo argumento do handler expõe params como Promise
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  try {
    const ad = await prisma.ad.findUnique({
      where: { id },
      // Selecione apenas colunas que sabemos que existem no schema
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
        imageUrl: true,          // mantenha este — seu schema usa imageUrl
        createdAt: true,
      },
    });

    if (!ad) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ ad });
  } catch (err) {
    console.error("GET /api/ads/[id] failed", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
