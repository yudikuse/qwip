// src/app/api/ads/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Tipagem mínima e estável do contexto (sem importar tipos do Next)
type Context = { params: { id?: string } };

export async function GET(_req: Request, { params }: Context) {
  const id = params?.id?.trim();
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  try {
    // Evita 'select' rígido para não estourar TS caso o schema tenha mudado
    const ad = await prisma.ad.findUnique({
      where: { id },
    });

    if (!ad) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ ad });
  } catch (err) {
    console.error("GET /api/ads/[id] failed:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
