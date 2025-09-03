// src/app/api/ads/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Body = {
  sellerPhoneE164?: string | null;

  title?: string | null;
  description?: string | null;
  priceCents?: number | null;

  city?: string | null;
  uf?: string | null;

  lat?: number | null;
  lng?: number | null;

  radiusKm?: number | null;
};

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    // -------- validações --------
    const sellerPhoneE164 = (body.sellerPhoneE164 ?? "").toString().trim();
    if (!sellerPhoneE164) {
      return NextResponse.json(
        { ok: false, error: "sellerPhoneE164 é obrigatório (ex.: +5511999999999)." },
        { status: 400 }
      );
    }

    const description = (body.description ?? "").toString().trim();
    if (!description) {
      return NextResponse.json(
        { ok: false, error: "Descrição é obrigatória." },
        { status: 400 }
      );
    }

    const priceCents = body.priceCents;
    if (!isFiniteNumber(priceCents) || priceCents <= 0) {
      return NextResponse.json({ ok: false, error: "Preço inválido." }, { status: 400 });
    }

    const lat = body.lat;
    const lng = body.lng;
    if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) {
      return NextResponse.json(
        { ok: false, error: "Coordenadas (lat/lng) são obrigatórias." },
        { status: 400 }
      );
    }

    const radiusKm =
      isFiniteNumber(body.radiusKm) && body.radiusKm! > 0 ? Math.round(body.radiusKm!) : 5;

    const safeTitle =
      (body.title ?? description.slice(0, 60)).toString().trim() || "Sem título";
    const safeCity = (body.city ?? "Atual").toString() || null;
    const safeUf = (body.uf ?? "").toString() || null;

    // expira em 24h
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // -------- cria o anúncio (conectando/criando Seller por phoneE164) --------
    const ad = await prisma.ad.create({
      data: {
        title: safeTitle,
        description,
        priceCents,

        city: safeCity,
        uf: safeUf,

        lat,
        lng,
        centerLat: lat,
        centerLng: lng,

        radiusKm,
        expiresAt,
        isActive: true,

        seller: {
          connectOrCreate: {
            where: { phoneE164: sellerPhoneE164 },
            create: { phoneE164: sellerPhoneE164 },
          },
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: ad.id });
  } catch (err) {
    console.error("[POST /api/ads] error:", err);
    return NextResponse.json(
      { ok: false, error: "Erro interno ao criar anúncio." },
      { status: 500 }
    );
  }
}
