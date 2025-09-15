// src/app/api/ads/search/route.ts
import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

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
  createdAt: Date;
  distance_km: number | null; // calculada quando geo ativo
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const q = (url.searchParams.get("q") || "").trim();
    const uf = (url.searchParams.get("uf") || "").trim().toUpperCase();
    const city = (url.searchParams.get("city") || "").trim();

    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(url.searchParams.get("pageSize") || "20", 10))
    );
    const offset = (page - 1) * pageSize;

    // Geo (opcional)
    const centerLat = url.searchParams.get("centerLat");
    const centerLng = url.searchParams.get("centerLng");
    const withinKm = url.searchParams.get("withinKm");

    const hasGeo =
      centerLat !== null &&
      centerLng !== null &&
      withinKm !== null &&
      isFinite(Number(centerLat)) &&
      isFinite(Number(centerLng)) &&
      isFinite(Number(withinKm));

    const conds: Prisma.Sql[] = [];

    // Só anúncios das últimas 24h
    conds.push(Prisma.sql`"createdAt" >= (NOW() - INTERVAL '24 hours')`);

    if (uf) {
      conds.push(Prisma.sql`"uf" = ${uf}`);
    }
    if (city) {
      // ilike para city
      conds.push(Prisma.sql`"city" ILIKE ${city}`);
    }
    if (q) {
      // busca básica em título/descrição
      const like = `%${q.replace(/%/g, "").replace(/_/g, "")}%`;
      conds.push(
        Prisma.sql`("title" ILIKE ${like} OR "description" ILIKE ${like})`
      );
    }

    // Haversine aproximado (em km), quando geo ativo
    let distanceExpr: Prisma.Sql | null = null;
    if (hasGeo) {
      const cLat = Number(centerLat);
      const cLng = Number(centerLng);
      const maxKm = Number(withinKm);

      distanceExpr = Prisma.sql`
        6371 * acos(
          least(1, greatest(-1,
            cos(radians(${cLat})) * cos(radians(COALESCE("centerLat","lat")))
          * cos(radians(COALESCE("centerLng","lng")) - radians(${cLng}))
          + sin(radians(${cLat})) * sin(radians(COALESCE("centerLat","lat")))
          ))
        )
      `;

      conds.push(Prisma.sql`${distanceExpr} <= ${maxKm}`);
    }

    const whereFrag: Prisma.Sql =
      conds.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(conds, Prisma.sql` AND `)}`
        : Prisma.sql``;

    // SELECT (se geo ativo, seleciona distance_km; senão, null)
    const selectItems = Prisma.sql`
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
        ${
          hasGeo && distanceExpr
            ? Prisma.sql`${distanceExpr} AS distance_km`
            : Prisma.sql`NULL::double precision AS distance_km`
        }
      FROM "Ad"
      ${whereFrag}
      ORDER BY "createdAt" DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const items = await prisma.$queryRaw<Row[]>(selectItems);

    // COUNT total (mesmo where)
    const selectCount = Prisma.sql`
      SELECT COUNT(*)::int AS total
      FROM "Ad"
      ${whereFrag}
    `;
    const [{ total }] = await prisma.$queryRaw<{ total: number }[]>(selectCount);

    return NextResponse.json({
      ok: true,
      page,
      pageSize,
      total,
      items,
    });
  } catch (err) {
    console.error("[/api/ads/search] ERRO:", err);
    return NextResponse.json(
      { ok: false, error: "Falha ao buscar anúncios." },
      { status: 500 }
    );
  }
}
