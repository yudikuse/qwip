// src/app/api/ads/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Ajuste os nomes de relação/campos abaixo conforme seu schema:
 * - relação do anúncio com o usuário: "seller" (se o seu for "user", troque).
 * - campos de telefone/verificação no usuário:
 *   - phoneE164 (string)
 *   - phoneVerifiedAt (Date|null)  OU  isPhoneVerified (boolean)
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> } // ✅ Next 15: params é Promise
) {
  try {
    const { id } = await ctx.params; // ✅ precisa dar await

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

        // ⬇️ Se no seu schema for "user" em vez de "seller", troque aqui e nas linhas mais abaixo.
        seller: {
          select: {
            phoneE164: true,
            phoneVerifiedAt: true,  // se não existir, deixe só isPhoneVerified
            isPhoneVerified: true,  // se não existir, deixe só phoneVerifiedAt
          },
        },
      },
    });

    if (!ad) {
      return NextResponse.json({ ad: null }, { status: 404 });
    }

    // Deriva sellerPhone somente se verificado
    let sellerPhone: string | null = null;
    if ((ad as any).seller) {
      const s = (ad as any).seller as {
        phoneE164?: string | null;
        phoneVerifiedAt?: Date | null;
        isPhoneVerified?: boolean;
      };

      const verified =
        (typeof s.isPhoneVerified === "boolean" && s.isPhoneVerified) ||
        (s.phoneVerifiedAt != null);

      if (verified && s.phoneE164) {
        const norm = s.phoneE164.replace(/[^\d+]/g, "");
        sellerPhone = norm.startsWith("+") ? norm : `+${norm}`;
      }
    }

    // Remove o objeto seller do payload final
    const { seller, ...rest } = ad as any;
    return NextResponse.json({ ad: { ...rest, sellerPhone } }, { status: 200 });
  } catch (err) {
    console.error("GET /api/ads/[id] error:", err);
    return NextResponse.json({ error: "Failed to load ad" }, { status: 500 });
  }
}
