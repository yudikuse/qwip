// src/app/api/ads/create/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helpers de validação/conversão
function toRequiredNumber(name: string, v: unknown): number {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  if (!Number.isFinite(n)) {
    throw new Error(`invalid_${name}`);
  }
  return n;
}
function toRequiredString(name: string, v: unknown): string {
  if (v === null || v === undefined) throw new Error(`missing_${name}`);
  const s = String(v).trim();
  if (!s) throw new Error(`missing_${name}`);
  return s;
}
function toOptionalString(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s ? s : undefined;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Obrigatórios (sem eles, 400)
    const title = toRequiredString("title", body?.title);
    const description = toRequiredString("description", body?.description);
    const priceCents = toRequiredNumber("priceCents", body?.priceCents);
    if (priceCents < 0 || !Number.isInteger(priceCents)) {
      throw new Error("invalid_priceCents");
    }

    // Campos obrigatórios de localização — conforme seu schema
    const lat = toRequiredNumber("lat", body?.lat);
    const lng = toRequiredNumber("lng", body?.lng);
    const centerLat = toRequiredNumber("centerLat", body?.centerLat);
    const centerLng = toRequiredNumber("centerLng", body?.centerLng);
    const radiusKm = toRequiredNumber("radiusKm", body?.radiusKm);

    // city/uf obrigatórios (string não vazia)
    const city = toRequiredString("city", body?.city);
    const uf = toRequiredString("uf", body?.uf);

    // Opcionais
    const imageUrl = toOptionalString(body?.imageUrl);
    const imageMime = toOptionalString(body?.imageMime);

    // Criação — sempre envia number nos geo (nunca undefined/null)
    const ad = await prisma.ad.create({
      data: {
        title,
        description,
        priceCents,
        city,
        uf,
        lat,
        lng,
        centerLat,
        centerLng,
        radiusKm,
        ...(imageUrl && { imageUrl }),
        ...(imageMime && { imageMime }),
      },
      select: { id: true, title: true },
    });

    return NextResponse.json({ ok: true, id: ad.id });
  } catch (err: any) {
    // Mapeia erros de validação em 400 com códigos previsíveis
    const msg: string = err?.message ?? "";
    if (
      msg.startsWith("missing_") ||
      msg.startsWith("invalid_")
    ) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    console.error("[/api/ads/create][POST] error:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
