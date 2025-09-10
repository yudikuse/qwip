// src/app/api/ads/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";

// ---------- Prisma ----------
const prisma = new PrismaClient();

// ---------- Limites / formatos ----------
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// ---------- Utils numéricos ----------
function toInt(v: unknown, def = 0) {
  const n = typeof v === "string" ? parseInt(v, 10) : Number(v);
  return Number.isFinite(n) ? n : def;
}
function toFloat(v: unknown, def = 0) {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : def;
}

// ---------- SafeVision (Google Vision SafeSearch) ----------
type SafeSearchResult =
  | { allowed: true; raw?: any }
  | { allowed: false; reason: string; raw?: any };

const SAFE_VISION_PROVIDER = (process.env.SAFE_VISION_PROVIDER || "google").toLowerCase();
const SAFE_VISION_DEBUG = (process.env.SAFE_VISION_DEBUG || "false").toLowerCase() === "true";
const SAFE_VISION_STRICT = (process.env.SAFE_VISION_STRICT || "false").toLowerCase() === "true";

// helper: decide reprovação pela escala do Google
function isBlockedByLevel(level: string, strict: boolean) {
  // níveis do Google: VERY_UNLIKELY | UNLIKELY | POSSIBLE | LIKELY | VERY_LIKELY
  if (strict) return level === "POSSIBLE" || level === "LIKELY" || level === "VERY_LIKELY";
  return level === "LIKELY" || level === "VERY_LIKELY";
}

async function safeCheckWithGoogleVision(imgBase64: string): Promise<SafeSearchResult> {
  const key = process.env.GOOGLE_VISION_API_KEY;
  if (!key) {
    // Sem chave => por segurança, reprova se STRICT, caso contrário permite
    if (SAFE_VISION_DEBUG) console.warn("[SAFE] GOOGLE_VISION_API_KEY ausente");
    return SAFE_VISION_STRICT
      ? { allowed: false, reason: "Configuração de moderação ausente." }
      : { allowed: true };
  }

  try {
    const body = {
      requests: [
        {
          features: [{ type: "SAFE_SEARCH_DETECTION" }],
          image: { content: imgBase64 },
        },
      ],
    };

    const res = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      if (SAFE_VISION_DEBUG) {
        console.warn("[SAFE] Vision HTTP", res.status, await res.text());
      }
      return SAFE_VISION_STRICT
        ? { allowed: false, reason: "Falha ao validar imagem (Vision API)." }
        : { allowed: true };
    }

    const data = await res.json();
    const annotation = data?.responses?.[0]?.safeSearchAnnotation;

    if (!annotation) {
      if (SAFE_VISION_DEBUG) console.warn("[SAFE] Sem safeSearchAnnotation no retorno");
      return SAFE_VISION_STRICT
        ? { allowed: false, reason: "Falha ao validar imagem (retorno inválido)." }
        : { allowed: true };
    }

    const { adult, violence, racy } = annotation;

    // Regras:
    // - Sempre bloquear adult ou violence de nível bloqueante
    // - racy bloqueia só se STRICT
    if (isBlockedByLevel(adult, SAFE_VISION_STRICT)) {
      return { allowed: false, reason: "Imagem com conteúdo adulto (adult)." , raw: annotation};
    }
    if (isBlockedByLevel(violence, SAFE_VISION_STRICT)) {
      return { allowed: false, reason: "Imagem com conteúdo violento.", raw: annotation };
    }
    if (SAFE_VISION_STRICT && isBlockedByLevel(racy, true)) {
      return { allowed: false, reason: "Imagem sexualmente sugestiva (racy).", raw: annotation };
    }

    if (SAFE_VISION_DEBUG) console.log("[SAFE] OK", annotation);
    return { allowed: true, raw: annotation };
  } catch (err) {
    if (SAFE_VISION_DEBUG) console.warn("[SAFE] Erro Vision:", err);
    return SAFE_VISION_STRICT
      ? { allowed: false, reason: "Erro ao validar imagem." }
      : { allowed: true };
  }
}

async function moderateImage(buf: Buffer): Promise<SafeSearchResult> {
  if (SAFE_VISION_PROVIDER !== "google") {
    // Sem provedor configurado — default permissivo (ou bloqueia se STRICT)
    return SAFE_VISION_STRICT
      ? { allowed: false, reason: "Moderação desativada na configuração." }
      : { allowed: true };
  }

  const base64 = buf.toString("base64");
  return safeCheckWithGoogleVision(base64);
}

// ---------- Handlers ----------
export async function GET() {
  return NextResponse.json({ ok: true, hint: "POST multipart/form-data para criar anúncio" });
}

export async function POST(req: Request) {
  try {
    // 1) Autorização pelo cookie (telefone verificado no frontend)
    const jar = cookies();
    const phoneCookie = jar.get("qwip_phone_e164")?.value;
    if (!phoneCookie) {
      return NextResponse.json(
        { error: "Autenticação necessária (verifique seu telefone)." },
        { status: 401 }
      );
    }

    // 2) Tem que ser multipart/form-data
    const ct = req.headers.get("content-type") || "";
    if (!ct.toLowerCase().includes("multipart/form-data")) {
      return NextResponse.json({ error: "Use multipart/form-data." }, { status: 415 });
    }

    // 3) Ler form
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

    // 5) Buffer da imagem
    const uint = new Uint8Array(await image.arrayBuffer());
    const buf = Buffer.from(uint);

    // 6) *** MODERAÇÃO ***
    const mod = await moderateImage(buf);
    if (!mod.allowed) {
      if (SAFE_VISION_DEBUG) console.warn("[SAFE] BLOQUEADA:", mod.reason, mod.raw);
      // EARLY RETURN: NÃO FAZ UPLOAD NEM CRIA NO BANCO
      return NextResponse.json({ error: mod.reason }, { status: 415 });
    }

    // 7) Hash + extensão
    const sha = createHash("sha256").update(buf).digest("hex");
    const ext =
      image.type === "image/jpeg" ? "jpg" :
      image.type === "image/png"  ? "png" :
      image.type === "image/webp" ? "webp" : "bin";

    // 8) Upload para Vercel Blob
    const blobPath = `ads/${sha}.${ext}`;
    const putRes = await put(blobPath, buf, {
      access: "public",
      contentType: image.type,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // 9) Persistir no banco (somente após upload OK)
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
        // sellerId: null (ainda)
      },
      select: { id: true },
    });

    // 10) Resposta OK
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
