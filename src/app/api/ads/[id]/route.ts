// src/app/api/ads/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/ads/:id
 * Retorna um anúncio por ID (ou 404).
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id;

  try {
    // Se o ID vier vazio/estranho:
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    }

    // Traga só o que a página realmente usa:
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
        // ❗ use a coluna que existe no schema
        imageUrl: true, // <- estava 'photoUrl' antes
        createdAt: true,
      },
    });

    if (!ad) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ ad });
  } catch (err) {
    console.error("GET /api/ads/[id] error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
