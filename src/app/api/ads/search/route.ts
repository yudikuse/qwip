// src/app/api/ads/search/route.ts
import { NextResponse } from "next/server";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// utils de parsing seguro
function toInt(v: unknown, def = 0) {
  const n = typeof v === "string" ? parseInt(v, 10) : Number(v);
  return Number.isFinite(n) ? n : def;
}
function toFloat(v: unknown, def = 0) {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : def;
}
function toBool(v: unknown) {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "1" || s === "true" || s === "on" || s === "yes";
  }
  return false;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // filtros básicos
    const q        = (searchParams.get("q") || "").trim();
    const uf       = (searchParams.get("uf") || "").trim().toUpperCase();
    const city     = (searchParams.get("city") || "").trim();

    const minPrice = toInt(searchParams.get("minPrice"));
    const maxPrice = toInt(searchParams.get("maxPrice"));

    // paginação
    const page     = Math.max(1, toInt(searchParams.get("page"), 1));
    const perPage  = Math.min(48, Math.max(1, toInt(searchParams.get("perPage"), 12)));
    const offset   = (page - 1) * perPage;

    // geo (opcional)
    const useGeo   = toBool(searchParams.get("geo")); // se true, usa center/radius
    const centerLat = toFloat(searchParams.get("lat"));
    const centerLng = toFloat(searchParams.get("lng"));
    const radiusKm  = Math.max(0, toFloat(searchParams.get("radiusKm"), 0));

    // CONDIÇÕES (sempre últimas 24h)
    const conds: Prisma.Sql[] = [
      Prisma.sql`"createdAt" >= NOW() - INTERVAL '24 hours'`,
    ];

    if (uf) {
      conds.push(Prisma.sql`"uf" = ${uf}`);
    }
    if (city) {
      conds.push(Prisma.sql`LOWER("city") = LOWER(${city})`);
    }

    if (minPrice > 0) {
      conds.push(Prisma.sql`"priceCents" >= ${minPrice}`);
    }
    if (maxPrice > 0) {
      conds.push(Prisma.sql`"priceCents" <= ${maxPrice}`);
    }

    if (q) {
      // busca textual simples (ILIKE em título/descrição)
      const like = `%${q}%`;
      conds.push(
        Prisma.sql`("title" ILIKE ${like} OR "description" ILIKE ${like})`,
      );
    }

    // GEO: se habilitado e com dados válidos, adiciona filtro por raio
    let selectDistance: Prisma.Sql = Prisma.sql`NULL::double precision AS distance_km`;
    if (
      useGeo &&
      Number.isFinite(centerLat) &&
      Number.isFinite(centerLng) &&
      radiusKm > 0
    ) {
      // Haversine: usa centerLat/centerLng se houver, senão lat/lng originais
      const refLat = Prisma.sql`COALESCE("centerLat","lat")`;
      const refLng = Prisma.sql`COALESCE("centerLng","lng")`;

      // distância (em km)
      const distExpr = Prisma.sql`
        6371 * acos(
          LEAST(
            1,
            cos(radians(${centerLat})) * cos(radians(${refLat}))
            * cos(radians(${refLng}) - radians(${centerLng}))
            + sin(radians(${centerLat})) * sin(radians(${refLat}))
          )
        )
      `;

      // seleciona a distância
      selectDistance = Prisma.sql`${distExpr} AS distance_km`;

      // e filtra pelo raio
      conds.push(Prisma.sql`${distExpr} <= ${radiusKm}`);
    }

    // WHERE dinâmico (IMPORTANTE: fragmento Sql — não é string)
    const whereFrag: Prisma.Sql =
      conds.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(conds, Prisma.sql` AND `)}`
        : Prisma.sql``;

    // COUNT total
    const totalRows = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM "Ad"
      ${whereFrag}
    `;
    const total = Number(totalRows?.[0]?.count ?? 0);

    // Itens
    type Row = {
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
      createdAt: string;
      distance_km: number | null;
    };

    const items = await prisma.$queryRaw<Row[]>`
      SELECT
        "id","title","description","priceCents","city","uf",
        "lat","lng","centerLat","centerLng","radiusKm",
        "imageUrl","createdAt",
        ${selectDistance}
      FROM "Ad"
      ${whereFrag}
      ORDER BY "createdAt" DESC
      LIMIT ${perPage}
      OFFSET ${offset}
    `;

    return NextResponse.json({
      ok: true,
      page,
      perPage,
      total,
      items,
    });
  } catch (err) {
    console.error("[/api/ads/search] ERRO:", err);
    return NextResponse.json({ ok: false, error: "Falha ao buscar anúncios" }, { status: 500 });
  }
}
