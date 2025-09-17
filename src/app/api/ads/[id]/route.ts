// src/app/api/ads/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Corrige o erro do Next 15 removendo a TIPAGEM do 2º argumento.
 * Use ctx.params em runtime.
 */
export async function GET(_req: Request, ctx: any) {
  const id: string | undefined = ctx?.params?.id;
  if (!id) {
    return NextResponse.json({ ok: false, error: "MISSING_ID" }, { status: 400 });
  }

  try {
    // Pegamos o anúncio + vendedor (sem SELECT pra não brigar com tipos)
    const ad = await prisma.ad.findUnique({
      where: { id },
      include: { seller: true },
    });

    if (!ad) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    // Extrai e normaliza telefone do vendedor
    const seller: any = (ad as any).seller || {};
    const rawPhone: string | null =
      seller.phoneE164 ?? seller.whatsapp ?? seller.phone ?? null;

    let sellerPhone: string | null = null;
    if (rawPhone) {
      // mantém apenas dígitos; remove "00" inicial se vier assim
      const digits = String(rawPhone).replace(/\D/g, "");
      const norm = digits.startsWith("00") ? digits.slice(2) : digits;
      if (norm.length >= 10) sellerPhone = norm; // ex.: 556499945XXXX
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
      centerLat: ad.centerLat,
      centerLng: ad.centerLng,
      radiusKm: ad.radiusKm,
      imageUrl: ad.imageUrl,
      createdAt: (ad.createdAt as any)?.toISOString?.() ?? ad.createdAt,
      expiresAt: (ad.expiresAt as any)?.toISOString?.() ?? ad.expiresAt ?? null,
      // Campo crítico para abrir o chat direto no botão do anúncio
      sellerPhone,
    };

    return NextResponse.json({ ok: true, ad: payload });
  } catch (err) {
    console.error("[GET /api/ads/:id] error:", err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
