// src/app/api/ads/search/route.ts
import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

/** helpers numéricos seguros */
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

    // filtros básicos
    const hours = toInt(url.searchParams.get("hours") ?? "24", 24);
    const uf = (url.searchParams.get("uf") ?? "").toUpperCase().trim();
    const city = (url.searchParams.get("city") ?? "").trim();

    // filtro geo opcional (centro + raio)
    const centerLat = toFloat(url.searchParams.get("centerLat"));
    const centerLng = toFloat(url.searchParams.get("centerLng"));
    const radiusKm = toFloat(url.searchParams.get("radiusKm"));

    // paginação
    const page = Math.max(1, toInt(url.searchParams.get("page") ?? "1", 1));
    const perPage = Math.min(50, Math.max(1, toInt(url.searchParams.get("perPage") ?? "12", 12)));
    const offset = (page - 1) * perPage;

    // Monta condições como fragmentos SQL seguros
    const conds: Prisma.Sql[] = [];

    // ativo nas últimas X horas
    conds.push(Prisma.sql`"createdAt" >= NOW() - INTERVAL '${hours} hours'`);

    if (uf) conds.push(Prisma.sql`UPPER("uf") = ${uf}`);
    if (city) conds.push(Prisma.sql`"city" ILIKE ${city}`);

    // filtro geográfico (aproximação rápida por bounding box + distância)
    let useGeo = false;
    if (Number.isFinite(centerLat) && Number.isFinite(centerLng) && Number.isFinite(radiusKm) && radiusKm > 0) {
      useGeo = true;
      const latDeg = radiusKm / 111.0;
      // evita cos(…) de 0/NaN
      const cosLat = Math.cos((centerLat * Math.PI) / 180);
      const lngDeg = cosLat !== 0 ? radiusKm / (111.0 * Math.max(0.000001, cosLat)) : radiusKm / 111.0;

      // primeiro: bounding box
      conds.push(Prisma.sql`
        "lat" BETWEEN ${centerLat - latDeg} AND ${centerLat + latDeg}
        AND "lng" BETWEEN ${centerLng - lngDeg} AND ${centerLng + lngDeg}
      `);
    }

    // WHERE inline; se não houver filtros, deixa vazio
    const whereFrag =
      conds.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(conds, Prisma.sql` AND `)}`
        : Prisma.sql``;

    // lista de itens + distância (se geo ligado, calculamos aprox. Haversine em km)
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
        ${
          useGeo
            ? Prisma.sql`
              (111.111 *
                DEGREES(ACOS(LEAST(1, COS(RADIANS(${centerLat}))
                  * COS(RADIANS(COALESCE("centerLat","lat")))
                  * COS(RADIANS(${centerLng}) - RADIANS(COALESCE("centerLng","lng")))
                  + SIN(RADIANS(${centerLat}))
                  * SIN(RADIANS(COALESCE("centerLat","lat")))
                )))))::float AS "distance_km"`
            : Prisma.sql`NULL::float AS "distance_km"`
        }
      FROM "Ad"
      ${whereFrag}
      ORDER BY "createdAt" DESC
      LIMIT ${perPage} OFFSET ${offset};
    `;

    // total para paginação
    const totalRows = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count FROM "Ad" ${whereFrag};
    `;
    const total = Number(totalRows?.[0]?.count ?? 0);

    return NextResponse.json({
      ok: true,
      page,
      perPage,
      total,
      items,
    });
  } catch (err) {
    console.error("[/api/ads/search] ERRO:", err);
    return NextResponse.json({ ok: false, error: "Falha na busca." }, { status: 500 });
  }
}
