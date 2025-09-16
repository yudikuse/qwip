// src/app/api/ads/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/ads/:id
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> } // Next 15: params é Promise
) {
  const { id } = await ctx.params;

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
        radiusKm: true,
        // IMPORTANTE: no schema existe "imageUrl" (não "photoUrl")
        imageUrl: true,
        createdAt: true,
      },
    });

    if (!ad) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ ad });
  } catch (err) {
    console.error("ad [id] route error", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
