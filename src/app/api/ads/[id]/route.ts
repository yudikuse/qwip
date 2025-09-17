// src/app/api/ads/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { onlyDigits } from "@/lib/whatsapp";

const prisma = new PrismaClient();

// Tipagem simples do ctx para evitar ruído em Next 15
export async function GET(_req: Request, ctx: any) {
  try {
    const id: string | undefined = ctx?.params?.id;
    if (!id) {
      return NextResponse.json({ ok: false, error: "MISSING_ID" }, { status: 400 });
    }

    const ad = await prisma.ad.findUnique({
      where: { id },
      include: { seller: true },
    });

    if (!ad) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    // tenta extrair um telefone do vendedor
    const rawSellerPhone: string | null =
      (ad as any)?.seller?.phoneE164 ??
      (ad as any)?.seller?.whatsapp ??
      (ad as any)?.seller?.phone ??
      null;

    let sellerPhone: string | null = null;
    if (rawSellerPhone) {
      let digits = onlyDigits(rawSellerPhone);
      if (digits.startsWith("00")) digits = digits.slice(2); // alguns exports vêm com 00
      // não forço 55 aqui; o componente faz a decisão final.
      if (digits.length >= 10) sellerPhone = digits;
    }

    const payload = {
      id: ad.id,
      title: ad.title,
      description: ad.description,
      priceCents: ad.priceCents,
      city: ad.city,
      uf: ad.uf,
      lat: ad.lat,
      lng: ad.lng,
      centerLat: (ad as any).centerLat ?? null,
      centerLng: (ad as any).centerLng ?? null,
      radiusKm: (ad as any).radiusKm ?? null,
      imageUrl: (ad as any).imageUrl ?? null,
      createdAt: (ad.createdAt as any)?.toISOString?.() ?? ad.createdAt,
      expiresAt: (ad.expiresAt as any)?.toISOString?.() ?? ad.expiresAt ?? null,
      sellerPhone, // <- usado pelo botão
    };

    return NextResponse.json({ ok: true, ad: payload });
  } catch (err) {
    console.error("[GET /api/ads/:id] error:", err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
