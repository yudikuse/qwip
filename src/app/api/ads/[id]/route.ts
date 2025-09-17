// src/app/api/ads/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> } // Next 15 → params é Promise
) {
  try {
    const { id } = await ctx.params;

    // ✔️ Use APENAS include (sem select) para evitar o erro.
    const ad = await prisma.ad.findUnique({
      where: { id },
      include: { seller: true },
    });

    if (!ad) {
      return NextResponse.json({ ad: null }, { status: 404 });
    }

    // --- Descobrir telefone verificado do seller (campos flexíveis) ---
    const seller = (ad as any).seller as Record<string, any> | null;

    let rawPhone: string | null = null;
    for (const k of ["phoneE164", "phone", "whatsapp", "whatsApp", "phoneNumber", "tel"]) {
      if (typeof seller?.[k] === "string" && seller[k].trim()) {
        rawPhone = seller[k].trim();
        break;
      }
    }

    let verified = false;
    for (const kb of ["isPhoneVerified", "phoneVerified", "isVerified"]) {
      if (typeof seller?.[kb] === "boolean") verified ||= seller[kb];
    }
    for (const kd of ["phoneVerifiedAt", "verifiedAt"]) {
      if (seller?.[kd]) verified = true;
    }

    // Normaliza para E.164 quando verificado
    let sellerPhone: string | null = null;
    if (rawPhone && verified) {
      const digits = rawPhone.replace(/[^\d+]/g, "");
      sellerPhone = digits.startsWith("+") ? digits : `+${digits}`;
    }

    // --- Monta resposta sem expor seller inteiro ---
    const {
      seller: _omit,
      id: adId,
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
      imageUrl,
      createdAt,
      expiresAt,
      // ... quaisquer outros campos que o model Ad possua
    } = ad as any;

    const payload = {
      id: adId,
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
      imageUrl,
      createdAt,
      expiresAt,
      sellerPhone, // usado no botão de WhatsApp no front
    };

    return NextResponse.json({ ad: payload }, { status: 200 });
  } catch (err) {
    console.error("GET /api/ads/[id] error:", err);
    return NextResponse.json({ error: "Failed to load ad" }, { status: 500 });
  }
}
