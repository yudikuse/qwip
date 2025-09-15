// src/app/api/ads/search/route.ts
import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// Util: parse helpers
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
    const sp = url.searchParams;

    // filtros básicos
    const q = (sp.get("q") || "").trim();
    const uf = (sp.get("uf") || "").trim().toUpperCase();
    const city = (sp.get("city") || "").trim();

    // geofiltro (opcional)
    const geo = (sp.get("geo") || "").toLowerCase() === "1";
    const centerLat = toFloat(sp.get("centerLat"));
    const centerLng = toFloat(sp.get("centerLng"));
    const radiusKm = toFloat(sp.get("radiusKm")); // quando > 0, filtra por raio

    // paginação
    const page = Math.max(1, toInt(sp.get("page"), 1));
    const perPage = Math.min(50, Math.max(1, toInt(sp.get("perPage"), 12)));
    const offset = (page - 1) * perPage;

    // janela de 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // monta condições (Sql[])
    const conds: Prisma.Sql[] = [Prisma.sql`"createdAt" >= ${since}`];

    if (uf) conds.push(Prisma.sql`"uf" = ${uf}`);
    if (city) conds.push(Prisma.sql`"city" = ${city}`);

    if (q) {
      const like = `%${q}%`;
      conds.push(
        Prisma.sql`("title" ILIKE ${like} OR "description" ILIKE ${like})`
      );
    }

    // distância (só se geo ativo e center válido)
    let distExpr: Prisma.Sql | null = null;
    if (geo && Number.isFinite(centerLat) && Number.isFinite(centerLng)) {
      // Haversine aproximado (km)
      distExpr = Prisma.sql`
        (6371 * acos(
          least(1, greatest(-1,
            cos(radians(${centerLat})) * cos(radians("centerLat")) *
            cos(radians("centerLng") - radians(${centerLng})) +
            sin(radians(${centerLat})) * sin(radians("centerLat"))
          ))
        ))
      `;

      // para usar distância, precisamos de coordenadas válidas no anúncio
      conds.push(Prisma.sql`"centerLat" IS NOT NULL AND "centerLng" IS NOT NULL`);

      if (radiusKm > 0) {
        conds.push(Prisma.sql`${distExpr} <= ${radiusKm}`);
      }
    }

    // ATENÇÃO AQUI: o separador do Prisma.join deve ser STRING
    const whereFrag: Prisma.Sql =
      conds.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(conds, " AND ")}`
        : Prisma.sql``;

    // SELECT items
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
    }>>`
      SELECT
        "id", "title", "description", "priceCents", "city", "uf",
        "lat", "lng", "centerLat", "centerLng", "radiusKm",
        "imageUrl", "createdAt",
        ${distExpr ?? Prisma.sql`NULL`} AS distance_km
      FROM "Ad"
      ${whereFrag}
      ORDER BY "createdAt" DESC
      LIMIT ${perPage} OFFSET ${offset}
    `;

    // COUNT total (mesmo WHERE)
    const totalRows = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count FROM "Ad" ${whereFrag}
    `;
    const total = Number(totalRows?.[0]?.count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    return NextResponse.json({
      ok: true,
      page,
      perPage,
      total,
      totalPages,
      items: items.map((i) => ({
        ...i,
        createdAt: i.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[/api/ads/search] ERRO:", err);
    return NextResponse.json({ ok: false, error: "Falha na busca" }, { status: 500 });
  }
}
