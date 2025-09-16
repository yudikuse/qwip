// src/app/api/ads/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// TTL em horas (mantenha alinhado com a vitrine)
const TTL_HOURS = 24;

export async function GET(
  _req: Request,
  ctx: { params: { id: string } }
) {
  const id = ctx?.params?.id;
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  try {
    const cutoff = new Date(Date.now() - TTL_HOURS * 60 * 60 * 1000);

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
        photoUrl: true,      // coluna no banco
        createdAt: true,
      },
    });

    // não existe ou expirado
    if (!ad || ad.createdAt < cutoff) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // envia ambos os nomes de campo para compatibilidade
    const payload = {
      ...ad,
      imageUrl: ad.photoUrl, // alias usado por algumas telas
    };

    return NextResponse.json({ ad: payload });
  } catch (e) {
    console.error("GET /api/ads/[id] error", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
