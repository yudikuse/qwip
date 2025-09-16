// src/app/api/ads/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext =
  | { params: { id: string } }
  | { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { id } = "then" in context.params ? await context.params : context.params;

    // Garanta que você TEM esses campos no schema.prisma:
    // model Ad {
    //   id          String   @id @default(cuid())
    //   title       String
    //   description String
    //   priceCents  Int
    //   city        String
    //   uf          String
    //   lat         Float?
    //   lng         Float?
    //   centerLat   Float?
    //   centerLng   Float?
    //   radiusKm    Int?
    //   imageUrl    String?
    //   createdAt   DateTime @default(now())
    // }
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
        imageUrl: true, // padronizado (NÃO use photoUrl aqui)
        createdAt: true,
      },
    });

    if (!ad) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // Padroniza tipos para o front (datas como string)
    const payload = {
      ...ad,
      createdAt: ad.createdAt.toISOString(),
    };

    return NextResponse.json({ ad: payload });
  } catch (err) {
    console.error("[GET /api/ads/[id]]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
