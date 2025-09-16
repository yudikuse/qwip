// src/app/api/ads/create/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function toNumOrUndef(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // validações básicas
    const title = (body?.title ?? "").toString().trim();
    const description = (body?.description ?? "").toString().trim();
    const priceCents = Number(body?.priceCents);
    if (!title) {
      return NextResponse.json({ error: "missing_title" }, { status: 400 });
    }
    if (!Number.isFinite(priceCents) || priceCents < 0) {
      return NextResponse.json({ error: "invalid_priceCents" }, { status: 400 });
    }

    // campos opcionais (usar undefined para omitir)
    const lat = toNumOrUndef(body?.lat);
    const lng = toNumOrUndef(body?.lng);
    const centerLat = toNumOrUndef(body?.centerLat);
    const centerLng = toNumOrUndef(body?.centerLng);
    const radiusKm = toNumOrUndef(body?.radiusKm);

    const city =
      body?.city != null && String(body.city).trim() !== "" ? String(body.city).trim() : undefined;
    const uf =
      body?.uf != null && String(body.uf).trim() !== "" ? String(body.uf).trim() : undefined;

    const imageUrl =
      body?.imageUrl != null && String(body.imageUrl).trim() !== ""
        ? String(body.imageUrl).trim()
        : undefined;

    const imageMime =
      body?.imageMime != null && String(body.imageMime).trim() !== ""
        ? String(body.imageMime).trim()
        : undefined;

    const ad = await prisma.ad.create({
      data: {
        title,
        description,
        priceCents,
        city,       // string | undefined
        uf,         // string | undefined
        lat,        // number | undefined  (≠ null) → omite se não vier
        lng,        // number | undefined
        centerLat,  // number | undefined
        centerLng,  // number | undefined
        radiusKm,   // number | undefined
        imageUrl,   // string | undefined
        imageMime,  // string | undefined
      },
      select: {
        id: true,
        title: true,
      },
    });

    return NextResponse.json({ ok: true, id: ad.id });
  } catch (err) {
    console.error("[/api/ads/create][POST] error:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
