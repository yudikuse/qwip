import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Varre um objeto e tenta achar um campo "telefone" provável */
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
          const key = k.toLowerCase();
          const isPhoneKey =
            key.includes("phone") ||
            key.includes("whats") ||
            key.includes("msisdn") ||
            key.includes("e164") ||
            key.includes("telefone") ||
            key === "tel";
          const digits = v.replace(/\D/g, "");
          if (digits.length >= 10 && (isPhoneKey || !best || digits.length > best.replace(/\D/g, "").length)) {
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

/** Normaliza para dígitos aceitos pelo WhatsApp (sem +). Assume BR=55 se não tiver DDI. */
function normalizeForWhatsApp(raw: string | null): string | null {
  if (!raw) return null;
  let d = raw.replace(/\D/g, ""); // só dígitos

  if (!d) return null;

  // remove zeros à esquerda
  d = d.replace(/^0+/, "");

  // se não tem DDI (<= 12 dígitos costuma ser local), prefixa 55
  if (d.length <= 12 && !d.startsWith("55")) d = `55${d}`;

  // casos em que ficou "550" por causa de DDD escrito com 0 (ex.: 05511...)
  d = d.replace(/^550+/, "55");

  // Brasil: 55 + 2 dígitos DDD + 8/9 dígitos de número (11~13 dígitos totais após 55)
  // Se tiver coisa a mais, cortamos do começo (usuários às vezes duplicam DDI/DDD).
  if (d.length > 13 && d.startsWith("55")) {
    // tenta manter o final (número) e os 2 do DDD
    d = "55" + d.slice(-11); // mantém DDD+9d (ou 8d; se for 8d ficará 10 e tudo ok)
  }

  // limites finais razoáveis
  if (d.length < 12 || d.length > 13) return null;

  return d;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> } // Next 15: params é Promise
) {
  try {
    const { id } = await ctx.params;

    // apenas include (sem select) para não conflitar tipos
    const ad = await prisma.ad.findUnique({
      where: { id },
      include: { seller: true },
    });

    if (!ad) return NextResponse.json({ ad: null }, { status: 404 });

    // tenta extrair telefone do seller (ou, na falta, do próprio anúncio)
    const rawPhone =
      findPhoneCandidate((ad as any).seller) ??
      findPhoneCandidate(ad as any);

    const sellerPhone = normalizeForWhatsApp(rawPhone);

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

    return NextResponse.json(
      {
        ad: {
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
          sellerPhone, // ← usado pelo botão
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/ads/[id] error:", err);
    return NextResponse.json({ error: "Failed to load ad" }, { status: 500 });
  }
}
