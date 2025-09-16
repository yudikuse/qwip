// src/app/api/ads/create/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function toNumOrUndef(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function toStrOrEmpty(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v).trim();
  return s;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // validações básicas obrigatórias
    const title = toStrOrEmpty(body?.title);
    const description = toStrOrEmpty(body?.description);
    const priceCents = Number(body?.priceCents);

    if (!title) {
      return NextResponse.json({ error: "missing_title" }, { status: 400 });
    }
    if (!Number.isFinite(priceCents) || priceCents < 0) {
      return NextResponse.json({ error: "invalid_priceCents" }, { status: 400 });
    }

    // strings obrigatórias no schema (não podem ser undefined)
    const city = toStrOrEmpty(body?.city); // se vier vazio, envia ""
    const uf = toStrOrEmpty(body?.uf);     // idem

    // opcionais (omitir com undefined se não vierem)
    const lat = toNumOrUndef(body?.lat);
    const lng = toNumOrUndef(body?.lng);
    const centerLat = toNumOrUndef(body?.centerLat);
    const centerLng = toNumOrUndef(body?.centerLng);
    const radiusKm = toNumOrUndef(body?.radiusKm);

    // opcionais string (podem ser undefined se seu schema permitir nullabilidade/optional)
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
        city,      // string obrigatória (nunca undefined)
        uf,        // string obrigatória (nunca undefined)
        lat,       // number | undefined
        lng,       // number | undefined
        centerLat, // number | undefined
        centerLng, // number | undefined
        radiusKm,  // number | undefined
        imageUrl,  // string | undefined
        imageMime, // string | undefined
      },
      select: { id: true, title: true },
    });

    return NextResponse.json({ ok: true, id: ad.id });
  } catch (err) {
    console.error("[/api/ads/create][POST] error:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
