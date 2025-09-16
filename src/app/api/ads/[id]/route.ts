// src/app/api/ads/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const id = (params?.id || "").trim();
  if (!id || id.length > 64) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  try {
    // Use apenas campos que realmente existem no schema
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
        imageUrl: true,      // <— substitui photoUrl
        phoneE164: true,     // usado para abrir o WhatsApp do anunciante (se existir)
        createdAt: true,
      },
    });

    if (!ad) return NextResponse.json({ error: "not_found" }, { status: 404 });

    return NextResponse.json({ ad });
  } catch (err) {
    console.error("GET /api/ads/[id] failed:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
