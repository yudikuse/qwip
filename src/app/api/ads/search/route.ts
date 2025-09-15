// src/app/api/ads/search/route.ts
import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

function toInt(v: string | null, def = 0) {
  if (v == null) return def;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
}
function toFloat(v: string | null, def = NaN) {
  if (v == null) return def;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : def;
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  // paginação
  const page = Math.max(1, toInt(url.searchParams.get("page"), 1));
  const pageSize = Math.min(50, Math.max(1, toInt(url.searchParams.get("pageSize"), 20)));
  const offset = (page - 1) * pageSize;

  // filtros simples
  const uf = (url.searchParams.get("uf") || "").trim().toUpperCase();
  const city = (url.searchParams.get("city") || "").trim();

  // filtros geo (opcionais)
  const lat = toFloat(url.searchParams.get("lat"));
  const lng = toFloat(url.searchParams.get("lng"));
  const radiusKm = toFloat(url.searchParams.get("radiusKm"));

  // condições base: últimos 1 dia (24h)
  const conds: Prisma.Sql[] = [
    Prisma.sql`"createdAt" >= NOW() - INTERVAL '24 hours'`,
  ];

  if (uf) {
    conds.push(Prisma.sql`"uf" = ${uf}`);
  }
  if (city) {
    conds.push(Prisma.sql`"city" = ${city}`);
  }

  // por padrão, distância nula
  let distanceSelect: Prisma.Sql = Prisma.sql`NULL::float AS distance_km`;

  // se lat/lng informados, calcula distância aprox. (Haversine)
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    distanceSelect = Prisma.sql`
      (6371 * acos(
        cos(radians(${lat!}))
        * cos(radians(COALESCE("centerLat", "lat")))
        * cos(radians(COALESCE("centerLng", "lng")) - radians(${lng!}))
        + sin(radians(${lat!})) * sin(radians(COALESCE("centerLat", "lat")))
      )) AS distance_km
    `;

    if (Number.isFinite(radiusKm) && radiusKm! > 0) {
      conds.push(Prisma.sql`
        (6371 * acos(
          cos(radians(${lat!}))
          * cos(radians(COALESCE("centerLat", "lat")))
          * cos(radians(COALESCE("centerLng", "lng")) - radians(${lng!}))
          + sin(radians(${lat!})) * sin(radians(COALESCE("centerLat", "lat")))
        )) <= ${radiusKm!}
      `);
    }
  }

  // WHERE dinâmico (tudo tipado como Sql)
  const whereFrag: Prisma.Sql =
    conds.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(conds, Prisma.sql` AND `)}`
      : Prisma.sql``;

  // itens
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
      "id","title","description","priceCents","city","uf",
      "lat","lng","centerLat","centerLng","radiusKm",
      "imageUrl","createdAt",
      ${distanceSelect}
    FROM "Ad"
    ${whereFrag}
    ORDER BY "createdAt" DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `);

  // total
  const totalRows = await prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
    SELECT COUNT(*)::bigint AS count
    FROM "Ad"
    ${whereFrag}
  `);
  const total = Number(totalRows[0]?.count ?? 0);

  return NextResponse.json({
    page,
    pageSize,
    total,
    items,
  });
}
