// src/app/api/ads/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// procura, dentro de um objeto qualquer, uma string que pareça telefone
function findPhoneCandidate(obj: unknown): string | null {
  try {
    const seen = new Set<unknown>();
    const stack: unknown[] = [obj];
    let best: string | null = null;

    while (stack.length) {
      const cur = stack.pop();
      if (!cur || typeof cur !== "object" || seen.has(cur)) continue;
      seen.add(cur);

      for (const [k, v] of Object.entries(cur as Record<string, unknown>)) {
        if (typeof v === "string") {
          // prioriza campos com nome “phone/whats”
          const kLower = k.toLowerCase();
          const weight =
            kLower.includes("phone") ||
            kLower.includes("whats") ||
            kLower.includes("msisdn") ||
            kLower.includes("e164");

          const digits = v.replace(/\D/g, "");
          if (digits.length >= 10 && (weight || (!best || digits.length > best.replace(/\D/g, "").length))) {
            best = v;
          }
        } else if (v && typeof v === "object") {
          stack.push(v);
        }
      }
    }
    return best;
  } catch {
    return null;
  }
}

// normaliza p/ wa.me: apenas dígitos, com DDI (assumo BR=55 se não tiver)
function normalizeForWa(raw: string | null): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, ""); // wa.me NÃO aceita '+'
  if (!digits) return null;

  // Se aparenta não ter DDI (ex.: 11xxxxxxxx ou 0xx...), prefixa 55
  if (digits.length <= 12 && !digits.startsWith("55")) {
    digits = `55${digits.replace(/^0+/, "")}`;
  }
  return digits;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> } // Next 15: params é Promise
) {
  try {
    const { id } = await ctx.params;

    // Use apenas include (sem select) para evitar o erro do Prisma
    const ad = await prisma.ad.findUnique({
      where: { id },
      include: { seller: true },
    });

    if (!ad) {
      return NextResponse.json({ ad: null }, { status: 404 });
    }

    // tenta achar telefone dentro do objeto seller (em qualquer campo)
    const rawPhone =
      findPhoneCandidate((ad as any).seller) ??
      // fallback: se por acaso gravaram no próprio anúncio
      findPhoneCandidate(ad as any);

    const sellerPhoneDigits = normalizeForWa(rawPhone);

    // monta payload que o front espera (sem expor seller inteiro)
    const {
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
      sellerPhone: sellerPhoneDigits, // << usado pelo botão do WhatsApp
    };

    return NextResponse.json({ ad: payload }, { status: 200 });
  } catch (err) {
    console.error("GET /api/ads/[id] error:", err);
    return NextResponse.json({ error: "Failed to load ad" }, { status: 500 });
  }
}
