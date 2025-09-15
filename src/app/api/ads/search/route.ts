import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/ads/search
 * Query params (todos opcionais):
 *  - q: string          -> busca por título/descrição (ILIKE)
 *  - uf: string         -> filtra por UF
 *  - city: string       -> filtra por cidade (nome inteiro ou prefixo)
 *  - lat, lng: number   -> ativa cálculo de distância (Haversine)
 *  - radiusKm: number   -> se informado junto com lat/lng, filtra por raio
 *  - page: number       -> paginação (default 1)
 *  - size: number       -> tamanho página (default 20, max 50)
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    const uf = (url.searchParams.get("uf") || "").trim().toUpperCase();
    const city = (url.searchParams.get("city") || "").trim();

    const lat = url.searchParams.get("lat");
    const lng = url.searchParams.get("lng");
    const radiusKmStr = url.searchParams.get("radiusKm");

    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const size = Math.min(50, Math.max(1, Number(url.searchParams.get("size") || 20)));
    const offset = (page - 1) * size;

    const latNum = lat ? Number(lat) : null;
    const lngNum = lng ? Number(lng) : null;
    const radiusKm = radiusKmStr ? Math.max(0, Number(radiusKmStr)) : null;

    // Condições dinâmicas construídas como Prisma.Sql
    const conds: Prisma.Sql[] = [];

    if (q) {
      // Busca em título/descrição (ILIKE %q%)
      const like = `%${q}%`;
      conds.push(
        Prisma.sql`(a."title" ILIKE ${like} OR a."description" ILIKE ${like})`
      );
    }

    if (uf) {
      conds.push(Prisma.sql`a."uf" = ${uf}`);
    }

    if (city) {
      // Se quiser prefix match, use ILIKE 'foo%'
      const likeCity = `${city}%`;
      conds.push(Prisma.sql`a."city" ILIKE ${likeCity}`);
    }

    // Geo: se vier lat/lng, podemos calcular distância Haversine (em km)
    let distanceSelect: Prisma.Sql = Prisma.sql`NULL::float AS distance_km`;
    if (latNum != null && lngNum != null) {
      // Fórmula Haversine aprox em km
      distanceSelect = Prisma.sql`
        (6371 * acos(
          cos(radians(${latNum})) * cos(radians(a."lat"))
          * cos(radians(a."lng") - radians(${lngNum}))
          + sin(radians(${latNum})) * sin(radians(a."lat"))
        )) AS distance_km
      `;

      // Se radiusKm vier, filtra por esse raio
      if (radiusKm != null && radiusKm > 0) {
        conds.push(
          Prisma.sql`a."lat" IS NOT NULL AND a."lng" IS NOT NULL`
        );
        conds.push(
          Prisma.sql`
            (6371 * acos(
              cos(radians(${latNum})) * cos(radians(a."lat"))
              * cos(radians(a."lng") - radians(${lngNum}))
              + sin(radians(${latNum})) * sin(radians(a."lat"))
            )) <= ${radiusKm}
          `
        );
      }
    }

    const whereFrag: Prisma.Sql =
      conds.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(conds, Prisma.sql` AND `)}`
        : Prisma.sql``;

    // SELECT principal (tudo com Prisma.sql — nada de string simples aqui)
    const itemsQuery = Prisma.sql`
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
        a."imageUrl",
        a."createdAt",
        ${distanceSelect}
      FROM "Ad" a
      ${whereFrag}
      ORDER BY
        ${latNum != null && lngNum != null ? Prisma.sql`distance_km ASC,` : Prisma.sql``}
        a."createdAt" DESC
      LIMIT ${size} OFFSET ${offset};
    `;

    const countQuery = Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM "Ad" a
      ${whereFrag};
    `;

    // Executa as duas queries
    const [items, countRows] = await Promise.all([
      prisma.$queryRaw<
        Array<{
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
          distance_km: number | null;
        }>
      >(itemsQuery),
      prisma.$queryRaw<Array<{ count: number }>>(countQuery),
    ]);

    const total = countRows?.[0]?.count ?? 0;

    return NextResponse.json({
      ok: true,
      page,
      size,
      total,
      items,
    });
  } catch (err) {
    console.error("search route error:", err);
    return NextResponse.json({ ok: false, error: "SEARCH_FAILED" }, { status: 500 });
  }
}
