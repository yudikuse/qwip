// src/app/api/ads/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { put } from "@vercel/blob";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- Configurações de segurança/feature flags via env ---
const SAFE_PROVIDER = process.env.SAFE_VISION_PROVIDER ?? "google"; // "none" | "google"
const SAFE_STRICT = (process.env.SAFE_VISION_STRICT ?? "false").toLowerCase() === "true";
const SAFE_DEBUG  = (process.env.SAFE_VISION_DEBUG ?? "false").toLowerCase() === "true";

const prisma = new PrismaClient();

// Carrega Vision só se for usar (evita crash em preview sem credenciais)
async function moderateOrThrow(file: File, base64?: string) {
  if (SAFE_PROVIDER !== "google") return;

  const apiKey = process.env.GOOGLE_VISION_API_KEY || "";
  if (!apiKey) {
    if (SAFE_STRICT) throw new Error("Vision não configurado");
    if (SAFE_DEBUG) console.warn("[SAFE] Vision desabilitado por falta de chave.");
    return;
  }

  // Gera base64 apenas quando necessário
  const b64 = base64 ?? Buffer.from(await file.arrayBuffer()).toString("base64");
  const body = {
    requests: [
      {
        image: { content: b64 },
        features: [{ type: "SAFE_SEARCH_DETECTION" }],
      },
    ],
  };

  const r = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
  );

  if (!r.ok) {
    if (SAFE_STRICT) throw new Error(`Vision falhou (${r.status})`);
    if (SAFE_DEBUG) console.warn("[SAFE] Vision HTTP", r.status, await r.text());
    return;
  }

  const j = await r.json();
  const safe = j?.responses?.[0]?.safeSearchAnnotation;
  if (!safe) {
    if (SAFE_STRICT) throw new Error("Vision sem resposta");
    return;
  }

  const level = (x: string) => ["VERY_UNLIKELY","UNLIKELY","POSSIBLE","LIKELY","VERY_LIKELY"].indexOf(x ?? "");
  const minAdult = process.env.SAFE_VISION_ADULT_MIN ?? "LIKELY";
  const minViol  = process.env.SAFE_VISION_VIOLENCE_MIN ?? "LIKELY";
  const minRacy  = process.env.SAFE_VISION_RACY_MIN ?? "VERY_LIKELY";

  const bad =
    level(safe.adult)    >= level(minAdult) ||
    level(safe.violence) >= level(minViol)  ||
    level(safe.racy)     >= level(minRacy);

  if (bad) throw new Error("Imagem reprovada pela moderação.");
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    const required = (key: string) => {
      const v = form.get(key);
      if (v == null) throw new Error(`Campo ausente: ${key}`);
      return v as string;
    };

    const title       = required("title");
    const description = required("description");
    const priceCents  = Number(required("priceCents"));
    const city        = required("city");
    const uf          = required("uf");
    const lat         = Number(required("lat"));
    const lng         = Number(required("lng"));
    const centerLat   = Number(required("centerLat"));
    const centerLng   = Number(required("centerLng"));
    const radiusKm    = Number(required("radiusKm"));
    const image       = form.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json({ error: "Arquivo de imagem inválido." }, { status: 400 });
    }
    if (!image.type.startsWith("image/")) {
      return NextResponse.json({ error: "Envie uma imagem." }, { status: 400 });
    }
    // limite de 3MB no servidor (além do cliente) para manter folga do limite da função
    if (image.size > 3 * 1024 * 1024) {
      return NextResponse.json({ error: "Imagem acima de 3MB." }, { status: 413 });
    }

    // Moderação (gera base64 uma única vez)
    const imgArrayBuffer = await image.arrayBuffer();
    const imgBase64 = Buffer.from(imgArrayBuffer).toString("base64");
    await moderateOrThrow(image, imgBase64);

    // Upload para Vercel Blob
    const sha = crypto.createHash("sha256").update(imgArrayBuffer).digest("hex");
    const ext =
      image.type === "image/jpeg" ? "jpg" :
      image.type === "image/png"  ? "png" :
      image.type === "image/webp" ? "webp" : "bin";
    const key = `ads/${sha}`;

    const putRes = await put(key, new Blob([imgArrayBuffer], { type: image.type }), {
      access: "public",
      contentType: image.type,
      addRandomSuffix: false, // chave baseada no sha
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Vendedor (por cookie)
    const phoneCookie = req.cookies.get("qwip_phone_e164")?.value ?? null;
    let sellerId: string | null = null;
    if (phoneCookie) {
      const seller = await prisma.seller.upsert({
        where: { phoneE164: phoneCookie },
        update: {},
        create: { phoneE164: phoneCookie },
        select: { id: true },
      });
      sellerId = seller.id;
    }

    // Cria anúncio
    const ad = await prisma.ad.create({
      data: {
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
        imageUrl: putRes.url,
        imageMime: image.type || "application/octet-stream",
        imageSha256: sha,
        sellerId,
      },
      select: { id: true },
    });

    return NextResponse.json({ id: ad.id }, { status: 201 });
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Falha ao criar anúncio.";
    const status = /imagem|modera|vision/i.test(msg) ? 400 : 500;

    // 413 vindo de limite do Vercel também cai aqui — preserve status quando possível
    if (typeof e?.status === "number" && e.status === 413) {
      return NextResponse.json({ error: "Payload muito grande." }, { status: 413 });
    }

    return NextResponse.json({ error: msg }, { status });
  }
}
