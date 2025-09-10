// src/app/api/ads/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";

const prisma = new PrismaClient();

// Limites e tipos aceitos
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// Helper numérico seguro
function toInt(v: unknown, def = 0) {
  const n = typeof v === "string" ? parseInt(v, 10) : Number(v);
  return Number.isFinite(n) ? n : def;
}
function toFloat(v: unknown, def = 0) {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : def;
}

// --- Moderação via Google Vision SafeSearch (REST) ---------------------------
/**
 * Retorna true se a imagem for considerada imprópria (adult/racy “likely+”).
 * Requer GOOGLE_VISION_API_KEY no ambiente.
 */
async function isImageInappropriate(buf: Buffer): Promise<boolean> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    // Se não houver chave, por segurança não bloqueia (ou troque para "true" se quiser travar sem chave)
    return false;
  }
  const b64 = buf.toString("base64");

  const payload = {
    requests: [
      {
        image: { content: b64 },
        features: [{ type: "SAFE_SEARCH_DETECTION" }],
      },
    ],
  };

  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // nada de cache
      cache: "no-store",
    }
  );

  if (!res.ok) {
    // Em caso de erro no provedor, não quebra o fluxo do usuário
    // (se quiser, mude para `return true` para bloquear quando falhar)
    return false;
  }

  const data = await res.json();
  const ann = data?.responses?.[0]?.safeSearchAnnotation;

  // Valores possíveis: VERY_UNLIKELY, UNLIKELY, POSSIBLE, LIKELY, VERY_LIKELY
  const adult = String(ann?.adult || "");
  const racy = String(ann?.racy || "");

  const isLikely = (v: string) => v === "LIKELY" || v === "VERY_LIKELY";

  return isLikely(adult) || isLikely(racy);
}

// -----------------------------------------------------------------------------

export async function GET() {
  return NextResponse.json({
    ok: true,
    hint: "Envie POST multipart/form-data para criar anúncio.",
  });
}

export async function POST(req: Request) {
  try {
    // 1) Autorização (cookie setado pelo fluxo de verificação)
    const jar = await cookies(); // <<<<<<<<<< CORREÇÃO: Next 15 exige await
    const phoneCookie = jar.get("qwip_phone_e164")?.value;
    if (!phoneCookie) {
      return NextResponse.json(
        { error: "Autenticação necessária (verifique seu telefone)." },
        { status: 401 }
      );
    }

    // 2) Content-Type precisa ser multipart/form-data
    const ct = req.headers.get("content-type") || "";
    if (!ct.toLowerCase().includes("multipart/form-data")) {
      return NextResponse.json({ error: "Use multipart/form-data." }, { status: 415 });
    }

    // 3) Lê o formulário
    const form = await req.formData();

    const title = String(form.get("title") || "").trim();
    const description = String(form.get("description") || "").trim();
    const priceCents = toInt(form.get("priceCents"));
    const city = String(form.get("city") || "").trim();
    const uf = String(form.get("uf") || "").trim().toUpperCase();
    const lat = toFloat(form.get("lat"));
    const lng = toFloat(form.get("lng"));
    const radiusKm = toFloat(form.get("radiusKm"));
    const image = form.get("image");

    // 4) Validações simples
    if (!title || !description || !priceCents || !city || !uf) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: "Coordenadas inválidas." }, { status: 400 });
    }
    if (!Number.isFinite(radiusKm) || radiusKm <= 0) {
      return NextResponse.json({ error: "Raio inválido." }, { status: 400 });
    }
    if (!(image instanceof File)) {
      return NextResponse.json({ error: "Imagem é obrigatória." }, { status: 400 });
    }
    if (!ACCEPTED_IMAGE_TYPES.has(image.type)) {
      return NextResponse.json(
        { error: "Formato não suportado. Use JPEG, PNG ou WEBP." },
        { status: 400 }
      );
    }
    if (image.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Imagem muito grande (máx. 4MB)." },
        { status: 413 }
      );
    }

    // 5) Lê bytes e calcula hash
    const uint = new Uint8Array(await image.arrayBuffer());
    const buf = Buffer.from(uint);
    const sha = createHash("sha256").update(buf).digest("hex");
    const ext =
      image.type === "image/jpeg" ? "jpg" :
      image.type === "image/png"  ? "png" :
      image.type === "image/webp" ? "webp" : "bin";

    // 6) *** MODERAÇÃO ANTES DE TUDO ***
    const blocked = await isImageInappropriate(buf);
    if (blocked) {
      // Não faz upload e não cria anúncio
      return NextResponse.json(
        { error: "Imagem reprovada pela moderação (conteúdo adulto/sexual)." },
        { status: 422 }
      );
    }

    // 7) Upload para Vercel Blob
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "Configuração de blob ausente. Defina BLOB_READ_WRITE_TOKEN." },
        { status: 500 }
      );
    }

    const blobPath = `ads/${sha}.${ext}`;
    const putRes = await put(blobPath, buf, {
      access: "public",
      contentType: image.type,
      token,
    });

    // 8) Persistência no banco (só aqui, após upload e moderação)
    const ad = await prisma.ad.create({
      data: {
        title,
        description,
        priceCents,
        city,
        uf,
        lat,
        lng,
        centerLat: lat, // por enquanto centro = ponto do autor
        centerLng: lng,
        radiusKm,
        imageUrl: putRes.url,
        imageMime: image.type,
        imageSha256: sha,
      },
      select: { id: true },
    });

    // 9) Done
    return NextResponse.json({ id: ad.id }, { status: 201 });
  } catch (err: any) {
    console.error("[/api/ads] ERRO:", err);
    const msg =
      typeof err?.message === "string" && err.message.toLowerCase().includes("token")
        ? "Falha no upload da imagem (verifique BLOB_READ_WRITE_TOKEN)."
        : "Erro ao criar anúncio.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
