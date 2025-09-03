import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const json = await req.json();

    // Leia do body ou, de preferência/extra, do cookie do request
    const phoneE164: string | null = json?.phoneE164 ?? null;
    if (!phoneE164) {
      return NextResponse.json({ ok: false, error: "Telefone não verificado." }, { status: 400 });
    }

    // ...validações dos demais campos (title, description, priceCents, city, uf, coords, radiusKm etc.)

    const data = {
      title: json.title,
      description: json.description,
      priceCents: json.priceCents,
      city: json.city,
      uf: json.uf,
      lat: json.lat,
      lng: json.lng,
      centerLat: json.centerLat ?? json.lat,
      centerLng: json.centerLng ?? json.lng,
      radiusKm: json.radiusKm,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isActive: true,

      // ✅ liga ao vendedor por phoneE164 (unique)
      seller: {
        connectOrCreate: {
          where: { phoneE164 },
          create: { phoneE164 },
        },
      },
    } as const;

    const ad = await prisma.ad.create({
      data,
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: ad.id });
  } catch (err) {
    console.error("[ads/create]", err);
    return NextResponse.json({ ok: false, error: "Falha ao criar anúncio." }, { status: 500 });
  }
}
