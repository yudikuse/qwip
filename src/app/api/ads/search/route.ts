// src/app/api/ads/search/route.ts
import { NextResponse } from "next/server";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// TTL em horas (mantenha igual ao detalhe)
const TTL_HOURS = 24;

/**
 * GET /api/ads/search
 * q, uf, city, lat, lng, radiusKm, limit, offset (todos opcionais)
 */
export async function GET(req: Request) {
  const url = new URL(req.url);

  const q = (url.searchParams.get("q") ?? "").trim();
  const uf = (url.searchParams.get("uf") ?? "").trim().toUpperCase();
  const city = (url.searchParams.get("city") ?? "").trim();

  const lat = url.searchParams.get("lat");
  const lng = url.searchParams.get("lng");
  const radiusKm = url.searchParams.get("radiusKm");

  // paginação (com fallback e clamp)
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 20), 1), 50);
  const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);

  // WHERE dinâmico
  const conds: Prisma.Sql[] = [];

  // TTL (últimas 24h)
  conds.push(Prisma.sql`a."createdAt" >= NOW() - INTERVAL '${TTL_HOURS} hours'`);

  if (q) {
    conds.push(
      Prisma.sql`(a.title ILIKE ${"%" + q + "%"} OR a.description ILIKE ${"%" + q + "%"})`
    );
  }
  if (uf) {
    conds.push(Prisma.sql`a.uf = ${uf}`);
  }
  if (city) {
    conds.push(Prisma.sql`a.city = ${city}`);
  }

  // Geo (Haversine aprox.) — só aplica se vier tudo
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

  // SELECT principal — padroniza photoUrl + imageUrl
  const baseSelect = Prisma.sql`
    SELECT
      a.id,
      a.title,
      a.description,
      a.uf,
      a.city,
      a.priceCents,
      a.photoUrl,
      a.photoUrl AS "imageUrl",
      a.lat,
      a.lng,
      a.createdAt
    FROM "Ad" a
    ${whereFrag}
    ORDER BY a."createdAt" DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  // COUNT total — mesmo WHERE
  const countSelect = Prisma.sql`
    SELECT COUNT(*)::int AS total
    FROM "Ad" a
    ${whereFrag}
  `;

  try {
    const rows = await prisma.$queryRaw<any[]>(baseSelect);
    const [{ total }] = (await prisma.$queryRaw<any[]>(countSelect)) as [{ total: number }];

    return NextResponse.json({ items: rows, total, limit, offset });
  } catch (err) {
    console.error("GET /api/ads/search error", err);
    return NextResponse.json({ error: "search_failed" }, { status: 500 });
  }
}
