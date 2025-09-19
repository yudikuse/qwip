import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

// ======= Config de imagem =======
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

// ======= Utils imagem (para JSON dataURL) =======
function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
  // data:image/png;base64,AAAA...
  const m = dataUrl.match(/^data:(.+);base64,(.+)$/i);
  if (!m) return null;
  const mime = (m[1] || "").toLowerCase();
  const b64 = m[2] || "";
  try {
    const buffer = Buffer.from(b64, "base64");
    return { mime, buffer };
  } catch {
    return null;
  }
}

// ===========================================
// GET /api/ads  -> lista anúncios (últimas 24h)
// ===========================================
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, toInt(searchParams.get("page") ?? "1", 1));
    const pageSize = Math.min(50, Math.max(8, toInt(searchParams.get("pageSize") ?? "12", 12)));

    const uf = (searchParams.get("uf") || "").trim().toUpperCase();
    const city = (searchParams.get("city") || "").trim();

    const lat = toFloat(searchParams.get("lat"));
    const lng = toFloat(searchParams.get("lng"));
    const radiusKm = toFloat(searchParams.get("radiusKm"));

    const since = new Date(Date.now() - ONE_DAY_MS);

    const whereBase: any = { createdAt: { gte: since } };
    if (uf) whereBase.uf = uf;
    if (city) whereBase.city = { equals: city, mode: "insensitive" as const };

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
    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      Number.isFinite(radiusKm) &&
      radiusKm > 0
    ) {
      const origin = { lat, lng };
      filtered = itemsRaw.filter((ad) => {
        const center = {
          lat: (ad.centerLat ?? ad.lat) as number,
          lng: (ad.centerLng ?? ad.lng) as number,
        };
        if (!Number.isFinite(center.lat) || !Number.isFinite(center.lng)) {
          return true; // sem centro definido, não filtra por distância
        }
        const d = haversineKm(origin, center);
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
// POST /api/ads  -> criação (multipart OU JSON)
// ===========================================
export async function POST(req: Request) {
  try {
    // 1) “autenticação” simples por cookie (telefone verificado)
    const jar = await cookies();
    const phoneCookie = jar.get("qwip_phone_e164")?.value;
    if (!phoneCookie) {
      return NextResponse.json(
        { error: "Autenticação necessária (verifique seu telefone)." },
        { status: 401 }
      );
    }

    const ct = (req.headers.get("content-type") || "").toLowerCase();

    // =========================
    // A) multipart/form-data
    // =========================
    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();

      const title = String(form.get("title") || "").trim();
      const description = String(form.get("description") || "").trim();
      const priceCents = toInt(form.get("priceCents"));
      const city = String(form.get("city") || "").trim();
      const uf = String(form.get("uf") || "").trim().toUpperCase();
      const lat = toFloat(form.get("lat"), NaN);
      const lng = toFloat(form.get("lng"), NaN);
      const radiusKm = toFloat(form.get("radiusKm"), 10);
      const image = form.get("image");
      const imageUrlFromForm = String(form.get("imageUrl") || "").trim();

      if (!title || !priceCents || !city || !uf) {
        return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
      }

      // imagem: ou arquivo, ou url já pronta
      let finalImageUrl: string | null = null;
      let finalImageMime: string | null = null;

      if (image instanceof File) {
        if (!ACCEPTED_IMAGE_TYPES.has(image.type)) {
          return NextResponse.json(
            { error: "Formato de imagem não suportado. Use JPEG, PNG ou WEBP." },
            { status: 400 }
          );
        }
        if (image.size > MAX_IMAGE_BYTES) {
          return NextResponse.json({ error: "Imagem muito grande (máx. 4MB)." }, { status: 413 });
        }

        const arr = new Uint8Array(await image.arrayBuffer());
        const buf = Buffer.from(arr);
        const sha = createHash("sha256").update(buf).digest("hex");
        const ext =
          image.type === "image/jpeg" ? "jpg" :
          image.type === "image/png"  ? "png" :
          image.type === "image/webp" ? "webp" : "bin";

        const putRes = await put(`ads/${sha}.${ext}`, buf, {
          access: "public",
          contentType: image.type,
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });

        finalImageUrl = putRes.url;
        finalImageMime = image.type;
      } else if (imageUrlFromForm) {
        finalImageUrl = imageUrlFromForm;
        finalImageMime = null;
      } else {
        return NextResponse.json({ error: "Imagem é obrigatória." }, { status: 400 });
      }

      // lat/lng agora são opcionais
      const latVal = Number.isFinite(lat) ? lat : null;
      const lngVal = Number.isFinite(lng) ? lng : null;

      const ad = await prisma.ad.create({
        data: {
          title,
          description, // <-- string sempre
          priceCents,
          city,
          uf,
          lat: latVal,
          lng: lngVal,
          centerLat: latVal,
          centerLng: lngVal,
          radiusKm: Number.isFinite(radiusKm) && radiusKm > 0 ? radiusKm : 10,
          imageUrl: finalImageUrl,
          imageMime: finalImageMime,
        },
        select: { id: true },
      });

      return NextResponse.json({ id: ad.id, ok: true }, { status: 201 });
    }

    // =========================
    // B) application/json
    // =========================
    const body = await req.json().catch(() => ({}));
    const {
      title,
      description,
      priceCents,
      city,
      uf,
      radiusKm,
      lat,
      lng,
      imageUrl,
      imageDataUrl,
    } = body || {};

    if (!title || !priceCents || !city || !uf) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
    }

    let finalImageUrl: string | null = null;
    let finalImageMime: string | null = null;

    if (typeof imageDataUrl === "string" && imageDataUrl.startsWith("data:")) {
      const parsed = parseDataUrl(imageDataUrl);
      if (!parsed) {
        return NextResponse.json({ error: "Imagem inválida (data URL)." }, { status: 400 });
      }
      if (!ACCEPTED_IMAGE_TYPES.has(parsed.mime)) {
        return NextResponse.json(
          { error: "Formato de imagem não suportado. Use JPEG, PNG ou WEBP." },
          { status: 400 }
        );
      }
      if (parsed.buffer.byteLength > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: "Imagem muito grande (máx. 4MB)." }, { status: 413 });
      }

      const sha = createHash("sha256").update(parsed.buffer).digest("hex");
      const ext =
        parsed.mime === "image/jpeg" ? "jpg" :
        parsed.mime === "image/png"  ? "png" :
        parsed.mime === "image/webp" ? "webp" : "bin";

      const putRes = await put(`ads/${sha}.${ext}`, parsed.buffer, {
        access: "public",
        contentType: parsed.mime,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      finalImageUrl = putRes.url;
      finalImageMime = parsed.mime;
    } else if (typeof imageUrl === "string" && imageUrl) {
      // URL já pronta
      finalImageUrl = imageUrl;
      finalImageMime = null;
    } else {
      return NextResponse.json({ error: "Imagem é obrigatória." }, { status: 400 });
    }

    const latVal = Number.isFinite(Number(lat)) ? Number(lat) : null;
    const lngVal = Number.isFinite(Number(lng)) ? Number(lng) : null;

    const ad = await prisma.ad.create({
      data: {
        title: String(title).trim(),
        description: String(description ?? "").trim(), // <-- string sempre
        priceCents: Number(priceCents) || 0,
        city: String(city).trim(),
        uf: String(uf).trim().toUpperCase(),
        lat: latVal,
        lng: lngVal,
        centerLat: latVal,
        centerLng: lngVal,
        radiusKm: Number(radiusKm) > 0 ? Number(radiusKm) : 10,
        imageUrl: finalImageUrl,
        imageMime: finalImageMime,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: ad.id }, { status: 201 });
  } catch (err: any) {
    console.error("[/api/ads][POST] ERRO:", err);
    const msg =
      typeof err?.message === "string" && err.message.toLowerCase().includes("token")
        ? "Falha no upload da imagem (verifique BLOB_READ_WRITE_TOKEN)."
        : "Erro ao criar anúncio.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
