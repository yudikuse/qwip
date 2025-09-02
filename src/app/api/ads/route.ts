// src/app/api/ads/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Body = {
  title?: string | null;
  description?: string | null;
  priceCents?: number | null;
  city?: string | null;
  uf?: string | null;
  lat?: number | null;
  lng?: number | null;
  radiusKm?: number | null;
  sellerId?: number | null; // ligaremos ao fluxo de SMS/OTP depois
};

export async function POST(req: Request) {
  try {
    const body: Body = await req.json();

    const {
      title,
      description,
      priceCents,
      city,
      uf,
      lat,
      lng,
      radiusKm,
      sellerId,
    } = body ?? {};

    // Validações mínimas
    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json({ ok: false, error: "Descrição é obrigatória." }, { status: 400 });
    }

    if (typeof priceCents !== "number" || !Number.isFinite(priceCents) || priceCents <= 0) {
      return NextResponse.json({ ok: false, error: "Preço inválido." }, { status: 400 });
    }

    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json(
        { ok: false, error: "Coordenadas (lat/lng) são obrigatórias." },
        { status: 400 }
      );
    }

    if (typeof sellerId !== "number") {
      // Exigimos sellerId por enquanto (o fluxo de SMS vem em seguida)
      return NextResponse.json(
        { ok: false, error: "sellerId obrigatório (aguardando verificação por SMS)." },
        { status: 400 }
      );
    }

    const safeTitle =
      (typeof title === "string" && title.trim()) ||
      description.trim().slice(0, 60) ||
      "Sem título";

    const safeCity = (typeof city === "string" && city) || "Atual";
    const safeUf = (typeof uf === "string" && uf) || "";
    const safeRadius = typeof radiusKm === "number" && radiusKm > 0 ? radiusKm : 5;

    // expira em 24h
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Conforme o schema (title, centerLat, centerLng e relação com seller são obrigatórios)
    const data = {
      title: safeTitle,
      description: description.trim(),
      priceCents,
      city: safeCity,
      uf: safeUf,
      lat,
      lng,
      centerLat: lat,
      centerLng: lng,
      radiusKm: safeRadius,
      expiresAt,
      isActive: true,
      seller: {
        connect: { id: sellerId },
      },
    };

    const ad = await prisma.ad.create({
      data,
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: ad.id });
  } catch (err) {
    console.error("[POST /api/ads] error:", err);
    return NextResponse.json({ ok: false, error: "Erro interno ao criar anúncio." }, { status: 500 });
  }
}
