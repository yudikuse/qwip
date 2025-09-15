import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const uf = (url.searchParams.get("uf") ?? "").trim().toUpperCase();
  const city = (url.searchParams.get("city") ?? "").trim();
  const sinceHours = Number(url.searchParams.get("sinceHours") ?? "24");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "20"), 50);
  const offset = Math.max(Number(url.searchParams.get("offset") ?? "0"), 0);

  try {
    const conds: Prisma.Sql[] = [];

    // Texto (título/descrição)
    if (q) {
      const like = `%${q}%`;
      conds.push(
        Prisma.sql`(title ILIKE ${like} OR description ILIKE ${like})`
      );
    }

    // UF / Cidade
    if (uf) conds.push(Prisma.sql`uf = ${uf}`);
    if (city) conds.push(Prisma.sql`city = ${city}`);

    // período (padrão: últimas 24h)
    if (!Number.isNaN(sinceHours) && sinceHours > 0) {
      conds.push(Prisma.sql`"createdAt" >= NOW() - INTERVAL '${sinceHours} hour'`);
    }

    // monta WHERE tipado
    const whereFrag =
      conds.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(conds, Prisma.sql` AND `)}`
        : Prisma.sql``;

    // Busca itens
    const items = await prisma.$queryRaw<Array<{
      id: string;
      title: string;
      description: string;
      priceCents: number;
      city: string;
      uf: string;
      lat: number | null;
      lng: number | null;
      centerLat: number | null;
      centerLng: number | null;
      radiusKm: number | null;
      imageUrl: string | null;
      createdAt: Date;
    }>>(Prisma.sql`
      SELECT
        id,
        title,
        description,
        "priceCents",
        city,
        uf,
        lat,
        lng,
        "centerLat",
        "centerLng",
        "radiusKm",
        "imageUrl",
        "createdAt"
      FROM "Ad"
      ${whereFrag}
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    // Count total
    const totalRows = await prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS count
      FROM "Ad"
      ${whereFrag}
    `);

    const total = Number(totalRows[0]?.count ?? 0);

    return NextResponse.json({ items, total });
  } catch (error) {
    console.error("GET /api/ads/search failed", {
      url: req.url,
      error:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : String(error),
    });
    return NextResponse.json({ error: "search_failed" }, { status: 500 });
  }
}
