import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

function toInt(v: unknown, def = 0) {
  const n = typeof v === "string" ? parseInt(v, 10) : Number(v);
  return Number.isFinite(n) ? n : def;
}
function toFloat(v: unknown, def = 0) {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : def;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    // filtros
    const q = (url.searchParams.get("q") || "").trim();
    const uf = (url.searchParams.get("uf") || "").trim().toUpperCase();
    const city = (url.searchParams.get("city") || "").trim();

    const centerLat = toFloat(url.searchParams.get("centerLat"));
    const centerLng = toFloat(url.searchParams.get("centerLng"));
    const radiusKm  = toFloat(url.searchParams.get("radiusKm"));

    // paginação
    const page = Math.max(1, toInt(url.searchParams.get("page"), 1));
    const pageSize = Math.min(50, Math.max(1, toInt(url.searchParams.get("pageSize"), 20)));
    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    // últimas 24h
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Condições base (todas em Prisma.sql)
    const conds: Prisma.Sql[] = [
      Prisma.sql`"active" = true`,
      Prisma.sql`"createdAt" >= ${cutoff}`,
    ];

    if (uf) {
      conds.push(Prisma.sql`"uf" = ${uf}`);
    }
    if (city) {
      conds.push(Prisma.sql`"city" = ${city}`);
    }
    if (q) {
      // busca simples em título/descrição
      const like = `%${q}%`;
      conds.push(
        Prisma.sql`("title" ILIKE ${like} OR "description" ILIKE ${like})`
      );
    }

    // Geo: se vier centro+raio válidos, filtramos por Haversine (aprox.)
    const useGeo =
      Number.isFinite(centerLat) &&
      Number.isFinite(centerLng) &&
      Number.isFinite(radiusKm) &&
      radiusKm > 0;

    // Expressão de distância em KM (repetimos onde precisar)
    const distExpr = Prisma.sql`
      6371 * acos(
        least(1, greatest(-1,
          cos(radians(${centerLat})) * cos(radians("lat")) * cos(radians("lng") - radians(${centerLng}))
          + sin(radians(${centerLat})) * sin(radians("lat"))
        ))
      )
    `;

    if (useGeo) {
      conds.push(Prisma.sql`${distExpr} <= ${radiusKm}`);
    }

    // WHERE fragment permanece como Prisma.Sql (NÃO string)
    const whereFrag: Prisma.Sql =
      conds.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(conds, Prisma.sql` AND `)}`
        : Prisma.sql``;

    // SELECT dos itens (inclui distância_km apenas se geo ativo; senão, null)
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
      distance_km: number | null;
    }>>(Prisma.sql`
      SELECT
        "id",
        "title",
        "description",
        "priceCents",
        "city",
        "uf",
        "lat",
        "lng",
        "centerLat",
        "centerLng",
        "radiusKm",
        "imageUrl",
        "createdAt",
        ${useGeo ? distExpr : Prisma.sql`NULL`} AS "distance_km"
      FROM "Ad"
      ${whereFrag}
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    // total para paginação (sem LIMIT/OFFSET)
    const totalRows = await prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS count
      FROM "Ad"
      ${whereFrag}
    `);
    const total = Number(totalRows?.[0]?.count ?? 0);

    return NextResponse.json({
      ok: true,
      page,
      pageSize,
      total,
      items: items.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[/api/ads/search] ERRO:", err);
    return NextResponse.json({ ok: false, error: "Falha ao buscar anúncios" }, { status: 500 });
  }
}
