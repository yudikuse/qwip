// src/app/api/ads/[id]/route.ts
// GET /api/ads/[id]
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Ajuste estes nomes de campos conforme seu schema real.
 * Pressupostos comuns:
 * - Ad tem relação seller -> User (chave sellerId).
 * - User possui phoneE164 (string) e phoneVerifiedAt (Date|null) ou isPhoneVerified (boolean).
 *
 * Se no seu schema os nomes divergirem, basta trocar nos selects/ifs abaixo.
 */

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Busca anúncio + vendedor
    const ad = await prisma.ad.findUnique({
      where: { id },
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

        // relação com o vendedor (ajuste o nome "seller" se for "user" no seu schema)
        seller: {
          select: {
            phoneE164: true,
            // use UM dos dois abaixo conforme existir no seu schema:
            phoneVerifiedAt: true,     // Date | null
            isPhoneVerified: true,     // boolean | undefined
          },
        },
      },
    });

    if (!ad) {
      return NextResponse.json({ ad: null }, { status: 404 });
    }

    // Deriva o telefone do vendedor apenas se estiver verificado
    let sellerPhone: string | null = null;
    if (ad.seller) {
      const verified =
        (typeof ad.seller.isPhoneVerified === "boolean" && ad.seller.isPhoneVerified) ||
        (ad.seller.phoneVerifiedAt != null);

      if (verified && ad.seller.phoneE164) {
        // Garante E.164 puro (só dígitos e + no começo)
        const digits = ad.seller.phoneE164.replace(/[^\d+]/g, "");
        sellerPhone = digits.startsWith("+") ? digits : `+${digits}`;
      }
    }

    // Remonta o payload sem vazar o objeto seller inteiro
    const { seller, ...rest } = ad;
    const payload = { ...rest, sellerPhone };

    return NextResponse.json({ ad: payload }, { status: 200 });
  } catch (err) {
    console.error("GET /api/ads/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to load ad" },
      { status: 500 }
    );
  }
}
