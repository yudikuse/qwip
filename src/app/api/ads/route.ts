// src/app/api/ads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // ajuste se seu client estiver em outro caminho
import { putImage } from '@/lib/storage';

// --------- Substitua este stub pela sua integração real (Vision/GCP etc.) ----------
async function moderateOrThrow(params: { imageBase64: string; title?: string; description?: string }) {
  // TODO: chame aqui sua função real de moderação usando o base64 (sem salvar em lugar nenhum).
  // Se reprovado, lance erro com mensagem amigável (em PT-BR).
  // Exemplo (stub aprovando sempre):
  return { approved: true as const };
}
// -----------------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      title,
      description,
      priceCents,
      imageBase64,     // continua vindo do client como hoje (mantém UX)
    } = body ?? {};

    if (!title || !description || typeof priceCents !== 'number' || !imageBase64) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes.' },
        { status: 400 }
      );
    }

    // (Opcional) Identidade do vendedor pelo cookie — ajuste o nome se necessário
    const phoneCookie = req.cookies.get('seller_phone')?.value ?? null;

    // 1) Moderação (fail-closed)
    await moderateOrThrow({ imageBase64, title, description });

    // 2) Persistir imagem no storage
    const stored = await putImage({ base64: imageBase64 });

    // 3) Seller: find-or-create S/ UNIQUE (robusto p/ dados legados)
    let sellerId: string | undefined = undefined;
    if (phoneCookie) {
      const seller = await prisma.$transaction(async (tx) => {
        // procura o primeiro Seller com esse telefone
        const found = await tx.seller.findFirst({
          where: { phone: phoneCookie },
          select: { id: true },
        });
        if (found) return found;
        // se não existe, cria
        const created = await tx.seller.create({
          data: { phone: phoneCookie },
          select: { id: true },
        });
        return created;
      });
      sellerId = seller.id;
    }

    // 4) Criar o anúncio com URL da imagem + metadados
    const ad = await prisma.ad.create({
      data: {
        title,
        description,
        priceCents,
        imageUrl: stored.url,
        imageMime: stored.mime,
        imageSha256: stored.sha256,
        sellerId, // pode ser undefined (campo é opcional)
      },
      select: { id: true },
    });

    return NextResponse.json({ id: ad.id }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/ads error:', err);
    const msg =
      typeof err?.message === 'string'
        ? err.message
        : 'Não foi possível criar o anúncio.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
