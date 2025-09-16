// src/app/api/ads/[id]/route.ts
import { NextResponse } from "next/server";
import type { RouteContext } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Next 15: params é Promise e precisa ser desestruturado do segundo argumento
export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "missing_id" }, { status: 400 });
    }

    const ad = await prisma.ad.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        uf: true,
        city: true,
        priceCents: true,
        imageUrl: true,     // use o nome real do schema
        lat: true,
        lng: true,
        centerLat: true,
        centerLng: true,
        radiusKm: true,
        createdAt: true,
      },
    });

    if (!ad) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ ad });
  } catch (err) {
    console.error("GET /api/ads/[id] failed:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
