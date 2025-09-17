// src/app/api/ads/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { onlyDigits } from "@/lib/whatsapp";

const prisma = new PrismaClient();

/** Pega o 1º telefone válido que encontrar em campos/relacionamentos comuns. */
function extractPhoneFromAd(ad: any): string | null {
  const candidates: Array<string | null | undefined> = [
    ad?.seller?.phoneE164,
    ad?.seller?.whatsapp,
    ad?.seller?.phone,

    ad?.sellerPhone,
    ad?.contactPhone,
    ad?.whatsapp,
    ad?.phone,
    ad?.phoneE164,

    ad?.owner?.phone,
    ad?.ownerPhone,
    ad?.user?.phone,
    ad?.createdBy?.phone,
  ];

  for (const c of candidates) {
    if (!c) continue;
    let digits = onlyDigits(c);
    if (digits.startsWith("00")) digits = digits.slice(2); // alguns exports vêm com 00
    if (digits.length >= 10) return digits; // DDD + número
  }
  return null;
}

export async function GET(_req: Request, ctx: any) {
  try {
    const id: string | undefined = ctx?.params?.id;
    if (!id) {
      return NextResponse.json({ ok: false, error: "MISSING_ID" }, { status: 400 });
    }

    const ad: any = await prisma.ad.findUnique({
      where: { id },
      include: { seller: true },
    });

    if (!ad) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const sellerPhone: string | null = extractPhoneFromAd(ad);

    const payload = {
      id: ad.id,
      title: ad.title,
      description: ad.description,
      priceCents: ad.priceCents,
      city: ad.city,
      uf: ad.uf,
      lat: ad.lat,
      lng: ad.lng,
      centerLat: ad.centerLat ?? null,
      centerLng: ad.centerLng ?? null,
      radiusKm: ad.radiusKm ?? null,
      imageUrl: ad.imageUrl ?? null,
      createdAt: ad.createdAt?.toISOString?.() ?? ad.createdAt,
      expiresAt: ad.expiresAt?.toISOString?.() ?? ad.expiresAt ?? null,
      sellerPhone, // usado no botão
    };

    return NextResponse.json({ ok: true, ad: payload });
  } catch (err) {
    console.error("[GET /api/ads/:id] error:", err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
