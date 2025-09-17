import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";

const prisma = new PrismaClient();

// ======= Config de imagem (criação) =======
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// ======= Utils numéricas =======
function toInt(v: unknown, def = 0) {
  const n = typeof v === "string" ? parseInt(v, 10) : Number(v);
  return Number.isFinite(n) ? n : def;
}
function toFloat(v: unknown, def = 0) {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : def;
}

// ======= Utils de listagem =======
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// ===========================================
// GET /api/ads  -> lista anúncios (últimas 24h)
// ===========================================
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, toInt(searchParams.get("page") ?? "1", 1));
    const pageSize = Math.min(
      50,
      Math.max(8, toInt(searchParams.get("pageSize") ?? "12", 12)),
    );

    const uf = (searchParams.get("uf") || "").trim().toUpperCase();
    const city = (searchParams.get("city") || "").trim();

    const lat = toFloat(searchParams.get("lat"));
    const lng = toFloat(searchParams.get("lng"));
    const radiusKm = toFloat(searchParams.get("radiusKm"));

    const since = new Date(Date.now() - ONE_DAY_MS);

    // Filtro base (últimas 24h)
    const whereBase: any = {
      createdAt: { gte: since },
    };

    if (uf) {
      whereBase.uf = uf;
    }
    if (city) {
      // case-insensitive
      whereBase.city = { equals: city, mode: "insensitive" as const };
    }

    // Puxamos "um pouco mais" se tiver filtro por raio para depois filtrar em memória
    const fetchSize = (lat && lng && radiusKm) ? Math.min(200, pageSize * 6) : pageSize;

    const itemsRaw = await prisma.ad.findMany({
      where: whereBase,
      orderBy: [{ createdAt: "desc" }],
      take: fetchSize,
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
        imageMime: true,
        createdAt: true,
      },
    });

    // Filtro por raio (opcional)
    let filtered = itemsRaw;
    if (Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(radiusKm) && radiusKm > 0) {
      const origin = { lat, lng };
      filtered = itemsRaw.filter((ad) => {
        const center = {
          lat: ad.centerLat ?? ad.lat,
          lng: ad.centerLng ?? ad.lng,
        };
        const d = haversineKm(origin, center);
        // anúncio "alcança" origin se estiver dentro do raio do anúncio
        // ou se origin estiver dentro do raio recebido na query
        return d <= (ad.radiusKm || 0) || d <= radiusKm;
      });
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = filtered.slice(start, end);

    return NextResponse.json({
      ok: true,
      page,
      pageSize,
      total,
      items: pageItems.map((ad) => ({
        ...ad,
        price: Number(ad.priceCents) / 100,
        expiresAt: new Date(ad.createdAt.getTime() + ONE_DAY_MS).toISOString(),
      })),
    });
  } catch (err) {
    console.error("[/api/ads][GET] ERRO:", err);
    return NextResponse.json({ ok: false, error: "Falha ao listar anúncios." }, { status: 500 });
  }
}

// ===========================================
// POST /api/ads  -> criação (agora copia telefone verificado)
// ===========================================
export async function POST(req: Request) {
  try {
    // 1) Autorização básica por cookie (telefone verificado no frontend)
    const jar = await cookies();
    const rawCookie = jar.get("qwip_phone_e164")?.value || "";
    const phoneE164 = rawCookie ? decodeURIComponent(rawCookie) : "";

    if (!phoneE164) {
      return NextResponse.json(
        { error: "Autenticação necessária (verifique seu telefone)." },
        { status: 401 }
      );
    }

    // 2) multipart/form-data
    const ct = req.headers.get("content-type") || "";
    if (!ct.toLowerCase().includes("multipart/form-data")) {
      return NextResponse.json({ error: "Use multipart/form-data." }, { status: 415 });
    }

    // 3) form
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

    // 4) validações
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
      return NextResponse.json({ error: "Imagem muito grande (máx. 4MB)." }, { status: 413 });
    }

    // 5) Buffer + hash
    const arr = new Uint8Array(await image.arrayBuffer());
    const buf = Buffer.from(arr);
    const sha = createHash("sha256").update(buf).digest("hex");
    const ext =
      image.type === "image/jpeg" ? "jpg" :
      image.type === "image/png"  ? "png" :
      image.type === "image/webp" ? "webp" : "bin";

    // 6) (aqui entra seu filtro de segurança de imagem antes do upload, se habilitado)
    // if (conteudoProibido) return NextResponse.json({ error: "Imagem proibida."}, { status: 400 });

    // 7) Upload Blob
    const blobPath = `ads/${sha}.${ext}`;
    const putRes = await put(blobPath, buf, {
      access: "public",
      contentType: image.type,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // 8) Dono do anúncio (fonte única: telefone verificado)
    const user = await prisma.user.upsert({
      where: { phoneE164 },
      update: { phoneE164 },
      create: { phoneE164, phoneVerifiedAt: new Date() },
      select: { id: true, phoneE164: true },
    });

    // 9) Persistência do anúncio + vínculo + cópia do telefone
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

        // >>>>>>> NOVO: liga ao usuário e grava o telefone do vendedor
        sellerId: user.id,
        sellerPhone: user.phoneE164,
      },
      select: { id: true },
    });

    return NextResponse.json({ id: ad.id, ok: true }, { status: 201 });
  } catch (err: any) {
    console.error("[/api/ads][POST] ERRO:", err);
    const msg =
      typeof err?.message === "string" && err.message.toLowerCase().includes("token")
        ? "Falha no upload da imagem (verifique BLOB_READ_WRITE_TOKEN)."
        : "Erro ao criar anúncio.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
