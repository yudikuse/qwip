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

    if (!description || typeof priceCents !== "number" || priceCents <= 0) {
      return NextResponse.json(
        { ok: false, error: "Descrição e preço válidos são obrigatórios." },
        { status: 400 }
      );
    }

    // expira em 24h
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // ⚠️ Seu schema atual exige city/uf/lat/lng como obrigatórios.
    // Usamos fallbacks para compilar e gravar sem erro.
    // Depois faremos a migração para torná-los opcionais.
    const data = {
      description: String(description),
      priceCents,
      city: (city ?? "Atual") as string,
      uf: (uf ?? "") as string,
      lat: typeof lat === "number" ? lat : 0,
      lng: typeof lng === "number" ? lng : 0,
      radiusKm: typeof radiusKm === "number" ? radiusKm : 5,
      expiresAt,
      isActive: true,
    };

    const ad = await prisma.ad.create({
      data,
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
