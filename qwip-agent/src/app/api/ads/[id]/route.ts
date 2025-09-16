// src/app/api/ads/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/ads/:id
 * Retorna um anúncio por id.
 *
 * Nota: assinatura corrigida para Next 15:
 *   GET(req: Request, ctx: RouteContext<{ id: string }>)
 */
/**
 * GET /api/ads/:id
 *
 * A API que retorna um anúncio pelo id. Esta função foi atualizada para a API do Next.js 15.
 * Em vez de importar o tipo `RouteContext` que não existe mais em `next/server`,
 * aceitamos um objeto simples com `params` contendo o parâmetro da rota.
 */
export async function GET(req: Request, context: { params: { id: string } }) {
  try {
    const id = context.params?.id;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    }

    // Incluímos o telefone do vendedor para que a página do anúncio possa
    // direcionar o usuário diretamente ao WhatsApp do anunciante. Também
    // selecionamos createdAt para cálculo posterior de expiração.
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
        seller: {
          select: {
            phone: true,
          },
        },
      },
    });

    if (!ad) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // Retorna o anúncio com o telefone do vendedor exposto como `sellerPhone`
    // para facilitar o consumo no front-end. Cópias extras são seguras,
    // preservando outros campos intactos.
    const result: any = { ...ad, sellerPhone: ad.seller?.phone ?? null };
    delete (result as any).seller;
    return NextResponse.json({ ad: result });
  } catch (err) {
    console.error("GET /api/ads/[id] error:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
