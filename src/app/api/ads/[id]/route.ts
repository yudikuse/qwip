// src/app/api/ads/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

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
        expiresAt: true,
        imageUrl: true,
        imageMime: true,
        imageSha256: true,
        createdAt: true,
        updatedAt: true,
        sellerId: true,
      },
    });

    if (!ad) {
      return NextResponse.json({ error: 'Ad não encontrado' }, { status: 404 });
    }

    return NextResponse.json(ad, { status: 200 });
  } catch (e: any) {
    console.error('GET /api/ads/[id] error:', e);
    return NextResponse.json({ error: 'Falha ao carregar anúncio' }, { status: 500 });
  }
}
