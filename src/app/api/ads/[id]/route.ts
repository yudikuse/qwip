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

    const ad = await prisma.ad.findUnique({
      where: { id },
      // ⚠️ Não especifique campos do Seller para não quebrar o tipo.
      include: { seller: true },
      select: {
        id: true,
        title: true,
        description: true,
        priceCents: true,
        city: true,
        uf: true,
        lat: true,
        lng: true,
        centerLat: true,
        centerLng: true,
        radiusKm: true,
        imageUrl: true,
        createdAt: true,
        expiresAt: true,
        seller: true, // já incluso acima
      },
    });

    if (!ad) {
      return NextResponse.json({ ad: null }, { status: 404 });
    }

    // Descobrir dinamicamente os campos de telefone/verificação
    const seller = (ad as any).seller as Record<string, any> | null;

    let rawPhone: string | null = null;
    for (const k of ["phoneE164", "phone", "whatsapp", "whatsApp", "phoneNumber", "tel"]) {
      if (typeof seller?.[k] === "string" && seller[k].trim()) {
        rawPhone = seller[k].trim();
        break;
      }
    }

    let verified = false;
    // booleanos comuns
    for (const kb of ["isPhoneVerified", "phoneVerified", "isVerified"]) {
      if (typeof seller?.[kb] === "boolean") {
        verified ||= seller[kb];
      }
    }
    // datas (considera verificado se tiver data)
    for (const kd of ["phoneVerifiedAt", "verifiedAt"]) {
      if (seller?.[kd]) {
        verified = true;
      }
    }

    // Normaliza telefone E164 (+55…)
    let sellerPhone: string | null = null;
    if (rawPhone && verified) {
      const digits = rawPhone.replace(/[^\d+]/g, "");
      sellerPhone = digits.startsWith("+") ? digits : `+${digits}`;
    }

    // Remove seller do payload final (privacidade) e injeta sellerPhone
    const { seller: _omit, ...rest } = ad as any;
    return NextResponse.json({ ad: { ...rest, sellerPhone } }, { status: 200 });
  } catch (err) {
    console.error("GET /api/ads/[id] error:", err);
    return NextResponse.json({ error: "Failed to load ad" }, { status: 500 });
  }
}
