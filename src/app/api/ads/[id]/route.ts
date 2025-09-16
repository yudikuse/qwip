// src/app/api/ads/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  _req: Request,
  ctx: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    const params = "then" in (ctx as any).params ? await (ctx as any).params : (ctx as any).params;
    const id = params?.id;
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
        imageUrl: true,        // <— apenas imageUrl
        createdAt: true,
      },
    });

    if (!ad) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ ad });
  } catch (err) {
    console.error("GET /api/ads/[id] failed:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
