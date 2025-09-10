// src/app/api/ads/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function GET(
  _req: Request,
  ctx: { params: { id: string } }
) {
  try {
    const id = ctx.params.id;
    if (!id) return NextResponse.json({ ok: false, error: "ID ausente." }, { status: 400 });

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
      },
    });

    if (!ad) return NextResponse.json({ ok: false, error: "Anúncio não encontrado." }, { status: 404 });

    // só anúncios das últimas 24h
    const expired = ad.createdAt.getTime() + ONE_DAY_MS < Date.now();
    if (expired) return NextResponse.json({ ok: false, error: "Anúncio expirado." }, { status: 404 });

    return NextResponse.json({
      ok: true,
      ad: {
        ...ad,
        price: Number(ad.priceCents) / 100,
        expiresAt: new Date(ad.createdAt.getTime() + ONE_DAY_MS).toISOString(),
      },
    });
  } catch (err) {
    console.error("[/api/ads/:id][GET] ERRO:", err);
    return NextResponse.json({ ok: false, error: "Falha ao carregar anúncio." }, { status: 500 });
  }
}
