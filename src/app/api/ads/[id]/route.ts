import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Context = { params: { id: string } };

// GET /api/ads/:id  -> retorna 404 se não existir
export async function GET(_req: NextRequest, { params }: Context) {
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  try {
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
        imageUrl: true, // <— existe no schema
        createdAt: true,
      },
    });

    if (!ad) {
      return NextResponse.json({ ad: null }, { status: 404 });
    }

    // serializa datas
    return NextResponse.json({
      ad: { ...ad, createdAt: ad.createdAt.toISOString() },
    });
  } catch (err) {
    console.error("GET /api/ads/[id] failed:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
