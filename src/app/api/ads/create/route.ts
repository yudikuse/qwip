// src/app/api/ads/create/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Espera JSON com:
// { title, description, priceCents, city, uf, lat?, lng?, centerLat?, centerLng?, radiusKm?, imageUrl? }
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const priceCents = Number(body.priceCents) | 0;

    const ad = await prisma.ad.create({
      data: {
        title: String(body.title ?? "").slice(0, 120),
        description: String(body.description ?? "").slice(0, 2000),
        priceCents: priceCents < 0 ? 0 : priceCents,
        city: String(body.city ?? "").slice(0, 100),
        uf: String(body.uf ?? "").slice(0, 2).toUpperCase(),

        // geoloc (todos opcionais)
        lat: body.lat == null ? null : Number(body.lat),
        lng: body.lng == null ? null : Number(body.lng),
        centerLat: body.centerLat == null ? null : Number(body.centerLat),
        centerLng: body.centerLng == null ? null : Number(body.centerLng),
        radiusKm: body.radiusKm == null ? null : Number(body.radiusKm),

        // URL do blob gerado no upload (já está aparecendo no storage)
        imageUrl: body.imageUrl ? String(body.imageUrl) : null,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: ad.id });
  } catch (err) {
    console.error("[POST /api/ads/create]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
