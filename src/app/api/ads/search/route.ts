// src/app/api/ads/search/route.ts
import { NextResponse } from "next/server";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// sane defaults
const MAX_PAGE_SIZE = 30;
const DEFAULT_PAGE_SIZE = 12;

function toInt(v: unknown, def = 0) {
  const n = typeof v === "string" ? parseInt(v, 10) : Number(v);
  return Number.isFinite(n) ? n : def;
}
function toFloat(v: unknown, def = 0) {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : def;
}
function clampPageSize(n: number) {
  return Math.max(1, Math.min(MAX_PAGE_SIZE, n || DEFAULT_PAGE_SIZE));
}
function sanitizeUF(s?: string) {
  const t = (s || "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(t) ? t : "";
}
function sanitizeCity(s?: string) {
  const t = (s || "").trim();
  return t.length > 100 ? t.slice(0, 100) : t;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, toInt(url.searchParams.get("page"), 1));
    const pageSize = clampPageSize(toInt(url.searchParams.get("pageSize"), DEFAULT_PAGE_SIZE));

    // filtros
    const uf = sanitizeUF(url.searchParams.get("uf") || undefined);
    const city = sanitizeCity(url.searchParams.get("city") || undefined);

    const lat = toFloat(url.searchParams.get("lat"));
    const lng = toFloat(url.searchParams.get("lng"));
    const hasGeo = Number.isFinite(lat) && Number.isFinite(lng);
    const radiusKm = toFloat(url.searchParams.get("radiusKm"), 0) || 0;

    // últimas 24h
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // paginação
    const offset = (page - 1) * pageSize;

    // Monta condições em SQL seguro (parametrizado)
    const conds: Prisma.Sql[] = [Prisma.sql`"createdAt" >= ${cutoff}`];

    if (uf) conds.push(Prisma.sql`"uf" = ${uf}`);
    if (city) conds.push(Prisma.sql`"city" ILIKE ${"%" + city + "%"}`);

    if (hasGeo && radiusKm > 0) {
      // garante que há centro salvo
      conds.push(Prisma.sql`"centerLat" IS NOT NULL AND "centerLng" IS NOT NULL`);
      // Haversine em km
      conds.push(Prisma.sql`
        (6371 * acos(
          cos(radians(${lat})) * cos(radians("centerLat")) *
          cos(radians("centerLng") - radians(${lng})) +
          sin(radians(${lat})) * sin(radians("centerLat"))
        )) <= ${radiusKm}
      `);
    }

    const whereSql = Prisma.sql`WHERE ${Prisma.join(conds, Prisma.sql` AND `)}`;

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
    }>>`
      SELECT
        "id","title","description","priceCents","city","uf",
        "lat","lng","centerLat","centerLng","radiusKm","imageUrl","createdAt"
      FROM "Ad"
      ${whereSql}
      ORDER BY "createdAt" DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    // total (para paginação)
    const totalRows = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM "Ad"
      ${whereSql}
    `;
    const total = Number(totalRows?.[0]?.count || 0);

    // serializa datas
    const data = items.map((it) => ({
      ...it,
      createdAt: it.createdAt.toISOString(),
    }));

    return NextResponse.json({
      ok: true,
      page,
      pageSize,
      total,
      items: data,
    });
  } catch (err) {
    console.error("[/api/ads/search] ERRO:", err);
    return NextResponse.json({ ok: false, error: "Falha ao listar anúncios." }, { status: 500 });
  }
}
