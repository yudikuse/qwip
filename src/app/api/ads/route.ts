// src/app/api/ads/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

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
    }: {
      title?: string | null;
      description?: string | null;
      priceCents?: number | null;
      city?: string | null;
      uf?: string | null;
      lat?: number | null;
      lng?: number | null;
      radiusKm?: number | null;
      sellerId?: number | null; // (vai vir do fluxo de OTP/SMS depois)
    } = body ?? {};

    if (!description || typeof priceCents !== "number" || priceCents <= 0) {
      return NextResponse.json(
        { ok: false, error: "Descrição e preço válidos são obrigatórios." },
        { status: 400 }
      );
    }

    // título mínimo
    const safeTitle =
      (title && title.trim()) ||
      description.trim().slice(0, 60) ||
      "Sem título";

    // expira em 24h
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Fallbacks exigidos pelo schema atual
    const safeCity = city ?? "Atual";
    const safeUf = uf ?? "";
    const safeLat =
