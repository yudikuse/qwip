// src/app/api/ads/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      description,
      priceCents,
      city,
      uf,
      lat,
      lng,
      radiusKm,
    }: {
      description?: string;
      priceCents?: number;
      city?: string | null;
      uf?: string | null;
      lat?: number | null;
      lng?: number | null;
      radiusKm?: number | null;
    } = body ?? {};

    if (!description || !priceCents || priceCents <= 0) {
      return NextResponse.json(
        { ok: false, error: "Descrição e preço são obrigatórios." },
        { status: 400 }
      );
    }

    // expira em 24h
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const ad = await prisma.ad.create({
      data: {
        description,
        priceCents,
        city: city ?? null,
        uf: uf ?? null,
        lat: lat ?? null,
        lng: lng ?? null,
        radiusKm: radiusKm ?? 5,
        expiresAt,
        isActive: true,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: ad.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Erro interno ao salvar o anúncio." },
      { status: 500 }
    );
  }
}
