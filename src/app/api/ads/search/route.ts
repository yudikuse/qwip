// src/app/api/ads/search/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// distância entre dois pares lat/lng (KM)
function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const la1 = toRad(aLat);
  const la2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * GET /api/ads/search
 * Query params:
 *  - q, uf, city
 *  - lat, lng, radiusKm (filtragem geográfica)
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

  // where básico (texto/uf/cidade) — tudo case-insensitive
  const where: any = {};
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  if (uf) where.uf = uf;
  if (city) where.city = { equals: city, mode: "insensitive" };

  try {
    // buscamos um "pool" de itens (maior que limit) para em seguida aplicar o filtro geo (se houver)
    // e paginar corretamente
    const poolSize = Math.max(limit * 3, 100);

    const baseRows = await prisma.ad.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: poolSize,
      select: {
        id: true,
        title: true,
        description: true,
        uf: true,
        city: true,
        priceCents: true,
        imageUrl: true, // no schema é imageUrl
        lat: true,
        lng: true,
        radiusKm: true,
        createdAt: true,
      },
    });

    let filtered = baseRows;

    // filtro geo (opcional)
    if (lat && lng && radiusKm) {
      const latNum = Number(lat);
      const lngNum = Number(lng);
      const rKm = Number(radiusKm);

      filtered = baseRows.filter((row) => {
        if (row.lat == null || row.lng == null) return false;
        const d = haversineKm(latNum, lngNum, row.lat, row.lng);
        return d <= rKm;
      });
    }

    const total = filtered.length;
    const items = filtered.slice(offset, offset + limit);

    return NextResponse.json({ items, total, limit, offset });
  } catch (err) {
    console.error("search route error", err);
    return NextResponse.json({ error: "search_failed" }, { status: 500 });
  }
}
