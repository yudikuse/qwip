// src/app/api/ads/search/route.ts
import { NextResponse } from "next/server";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/ads/search
 * Query params opcionais:
 *  - q, uf, city
 *  - lat, lng, radiusKm
 *  - limit, offset
 */
export async function GET(req: Request) {
  const url = new URL(req.url);

  const q = (url.searchParams.get("q") ?? "").trim();
  const uf = (url.searchParams.get("uf") ?? "").trim().toUpperCase();
  const city = (url.searchParams.get("city") ?? "").trim();

  const lat = url.searchParams.get("lat");
  const lng = url.searchParams.get("lng");
  const radiusKm = url.searchParams.get("radiusKm");

  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 20), 1), 50);
  const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);

  // WHERE dinâmico com Prisma.sql
  const conds: Prisma.Sql[] = [];

  if (q) {
    conds.push(
      Prisma.sql`(a.title ILIKE ${"%" + q + "%"} OR a.description ILIKE ${"%" + q + "%"})`
    );
  }
  if (uf) conds.push(Prisma.sql`a.uf = ${uf}`);
  if (city) conds.push(Prisma.sql`a.city = ${city}`);

  if (lat && lng && radiusKm) {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    const rKm = Number(radiusKm);

    const haversine = Prisma.sql`
      6371 * acos(
        cos(radians(${latNum})) * cos(radians(a.lat)) * cos(radians(a.lng) - radians(${lngNum}))
        + sin(radians(${latNum})) * sin(radians(a.lat))
      )
    `;

    conds.push(Prisma.sql`${haversine} <= ${rKm}`);
  }

  const whereFrag: Prisma.Sql =
    conds.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(conds, Prisma.sql` AND `)}`
      : Prisma.sql``;

  // SELECT principal
  const baseSelect = Prisma.sql`
    SELECT
      a.id,
      a.title,
      a.description,
      a.uf,
      a.city,
      a.priceCents,
      a.photoUrl,
      a.imageUrl,
      a.lat,
      a.lng,
      a.centerLat,
      a.centerLng,
      a.radiusKm,
      a.createdAt
    FROM "Ad" a
    ${whereFrag}
    ORDER BY a.createdAt DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  // COUNT total
  const countSelect = Prisma.sql`
    SELECT COUNT(*)::int AS total
    FROM "Ad" a
    ${whereFrag}
  `;

  try {
    // $queryRaw aceita Prisma.Sql
    const rows = await prisma.$queryRaw<any[]>(baseSelect);
    const [{ total }] = (await prisma.$queryRaw<any[]>(countSelect)) as [{ total: number }];

    // Normaliza imagem e data
    const items = rows.map((r) => ({
      ...r,
      imageUrl: r.imageUrl ?? r.photoUrl ?? null,
      createdAt:
        typeof r.createdAt === "string"
          ? r.createdAt
          : r.createdAt?.toISOString?.() ?? null,
    }));

    return NextResponse.json({ items, total, limit, offset });
  } catch (err) {
    console.error("search route error", err);
    return NextResponse.json({ error: "search_failed" }, { status: 500 });
  }
}
