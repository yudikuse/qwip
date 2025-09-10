// src/app/api/ads/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";

const prisma = new PrismaClient();

// Limites/tipos aceitos para imagem
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB
const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

// Utils numéricos
function toInt(v: unknown, def = 0) {
  const n = typeof v === "string" ? parseInt(v, 10) : Number(v);
  return Number.isFinite(n) ? n : def;
}
function toFloat(v: unknown, def = 0) {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : def;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    hint: "Envie POST multipart/form-data para criar anúncio.",
  });
}

export async function POST(req: Request) {
  try {
    // 1) Autorização por cookie (telefone verificado)
    const jar = await cookies(); // <- necessário em versões recentes do Next
    const phoneCookie = jar.get("qwip_phone_e164")?.value;
    if (!phoneCookie) {
      return NextResponse.json(
        { error: "Autenticação necessária (verifique seu telefone)." },
        { status: 401 }
      );
    }

    // 2) Verifica Content-Type (multipart)
    const ct = req.headers.get("content-type") || "";
    if (!ct.toLowerCase().includes("multipart/form-data")) {
      return NextResponse.json({ error: "Use multipart/form-data." }, { status: 415 });
    }

    // 3) Lê o form
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

    // 4) Validações básicas
    if (!title || !description || !priceCents || !city || !uf) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes." },
        { status: 400 }
      );
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
        { error: "Formato de imagem não suportado. Use JPEG, PNG ou WEBP." },
        { status: 400 }
      );
    }
    if (image.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Imagem muito grande (máx. 4MB)." },
        { status: 413 }
      );
    }

    // 5) Converte para Buffer e calcula SHA-256
    const buf = Buffer.from(await image.arrayBuffer());
    const sha = createHash("sha256").update(buf).digest("hex");
    const ext =
      image.type === "image/jpeg"
        ? "jpg"
        : image.type === "image/png"
        ? "png"
        : image.type === "image/webp"
        ? "webp"
        : "bin";

    // 6) Tenta subir ao Vercel Blob
    //    Se falhar (token inválido, imagem rejeitada, etc.), NÃO cria anúncio.
    let putRes: { url: string };
    try {
      const blobPath = `ads/${sha}.${ext}`;
      putRes = await put(blobPath, buf, {
        access: "public",
        contentType: image.type,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
    } catch (err) {
      console.error("Falha no upload para o Blob:", err);
      return NextResponse.json(
        { error: "Imagem rejeitada ou não pôde ser salva." },
        { status: 400 }
      );
    }

    // 7) Só cria o anúncio se o upload deu certo
    const ad = await prisma.ad.create({
      data: {
        title,
        description,
        priceCents,
        city,
        uf,
        lat,
        lng,
        centerLat: lat, // por ora, centro = posição informada
        centerLng: lng,
        radiusKm,
        imageUrl: putRes.url,
        imageMime: image.type,
        imageSha256: sha,
        // sellerId: null por enquanto
      },
      select: { id: true },
    });

    // 8) Retorna sucesso
    return NextResponse.json({ id: ad.id }, { status: 201 });
  } catch (err: any) {
    console.error("[/api/ads] ERRO:", err);
    return NextResponse.json(
      { error: "Erro ao criar anúncio." },
      { status: 500 }
    );
  }
}
