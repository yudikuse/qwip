import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Evita cache agressivo em plataformas edge
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: any) {
  try {
    const id = ctx?.params?.id as string | undefined;
    if (!id) {
      return NextResponse.json({ error: "Parâmetro 'id' é obrigatório." }, { status: 400 });
    }

    // Busca anúncio
    const ad = await prisma.ad.findUnique({
      where: { id },
      // Se quiser limitar a anúncios ainda válidos (24h), descomente:
      // where: {
      //   id,
      //   createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      // },
    });

    if (!ad) {
      return NextResponse.json({ error: "Anúncio não encontrado." }, { status: 404 });
    }

    return NextResponse.json(ad, { status: 200 });
  } catch (err) {
    console.error("[/api/ads/[id]] ERRO:", err);
    return NextResponse.json({ error: "Falha ao carregar anúncio." }, { status: 500 });
  }
}
