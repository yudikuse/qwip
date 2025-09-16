// src/app/api/ads/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    // Extrai o id do path, evitando depender do tipo do 2º argumento
    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const id = segments[segments.length - 1];

    if (!id) {
      return NextResponse.json({ error: "missing_id" }, { status: 400 });
    }

    // Seleciona os campos necessários
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
        // dependendo do schema, sua coluna pode chamar photoUrl ou imageUrl
        photoUrl: true,
        imageUrl: true,
        createdAt: true,
      },
    });

    if (!ad) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // Normaliza o nome do campo de imagem e datas para string
    const payload = {
      ...ad,
      imageUrl: ad.imageUrl ?? ad.photoUrl ?? null,
      createdAt:
        typeof ad.createdAt === "string"
          ? ad.createdAt
          : ad.createdAt?.toISOString?.() ?? null,
    };

    return NextResponse.json({ ad: payload });
  } catch (err) {
    console.error("ads/[id] GET error:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
