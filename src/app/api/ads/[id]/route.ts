import { NextResponse } from "next/server";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/ads/[id]
 * Retorna 404 se não existir.
 */
export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const { id } = ctx.params;

  try {
    // Usamos SQL cru p/ ficar imune a diferenças de nomes (photoUrl vs imageUrl)
    const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        a."id",
        a."title",
        a."description",
        a."priceCents",
        a."city",
        a."uf",
        a."lat",
        a."lng",
        a."centerLat",
        a."centerLng",
        a."radiusKm",
        COALESCE(a."imageUrl", a."photoUrl") AS "imageUrl",
        a."createdAt"
      FROM "Ad" a
      WHERE a."id" = ${id}
      LIMIT 1
    `);

    const ad = rows?.[0] ?? null;
    if (!ad) return NextResponse.json({ error: "not_found" }, { status: 404 });

    return NextResponse.json({ ad });
  } catch (err) {
    console.error("GET /api/ads/[id] failed:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
