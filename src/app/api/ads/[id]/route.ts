import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(_req: Request, ctx: any) {
  try {
    const id: string | undefined = ctx?.params?.id;
    if (!id) {
      return NextResponse.json({ ok: false, error: "MISSING_ID" }, { status: 400 });
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
        createdAt: true,
        expiresAt: true,
        // sellerId / sellerPhone não existem no schema atual
      },
    });

    if (!ad) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const payload = {
      ...ad,
      createdAt: (ad.createdAt as any)?.toISOString?.() ?? ad.createdAt,
      expiresAt: (ad.expiresAt as any)?.toISOString?.() ?? ad.expiresAt ?? null,
      // sellerPhone será resolvido na página via cookie (ver arquivo da página)
    };

    return NextResponse.json({ ok: true, ad: payload });
  } catch (err) {
    console.error("[GET /api/ads/:id] error:", err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
