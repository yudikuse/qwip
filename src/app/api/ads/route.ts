// src/app/api/ads/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";

// 🔧 Garante ambiente Node (necessário para Buffer/crypto)
export const runtime = "nodejs";

const prisma = new PrismaClient();

// Limites / tipos de imagem aceitos
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// Helpers numéricos
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
    hint: "Envie POST multipart/form-data para criar anúncio",
  });
}

export async function POST(req: Request) {
  try {
    // 1) Autorização básica (telefone verificado via cookie)
    //    Next 15 => cookies() é assíncrono nos route handlers.
    const jar = await cookies();
    const phoneCookie = jar.get("qwip_phone_e164")?.value;
    if (!phoneCookie) {
      return NextResponse.json(
        { error: "Autenticação necessária (verifique seu telefone)." },
        { status: 401 }
      );
    }

    // 2) Conteúdo deve ser multipart/form-data
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

    // 4) Validações
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

    // 5) Buffer da imagem (usa Buffer/crypto no runtime Node)
    const uint = new Uint8Array(await image.arrayBuffer());
    const buf = Buffer.from(uint);

    const sha = createHash("sha256").update(buf).digest("hex");
    const ext =
      image.type === "image/jpeg" ? "jpg" :
      image.type === "image/png"  ? "png" :
      image.type === "image/webp" ? "webp" : "bin";

// 6) Upload no Vercel Blob (com proteção)
let putRes;
try {
  const blobPath = `ads/${sha}.${ext}`;
  putRes = await put(blobPath, buf, {
    access: "public",
    contentType: image.type,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
} catch (err: any) {
  console.error("Falha no upload para o Blob:", err);
  return NextResponse.json(
    { error: "Imagem rejeitada ou inválida (não foi salva)." },
    { status: 400 }
  );
}

// 7) Só chega aqui se upload foi OK
const ad = await prisma.ad.create({
  data: {
    title,
    description,
    priceCents,
    city,
    uf,
    lat,
    lng,
    centerLat: lat,
    centerLng: lng,
    radiusKm,
    imageUrl: putRes.url,
    imageMime: image.type,
    imageSha256: sha,
  },
  select: { id: true },
});


    // 8) Resposta
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
