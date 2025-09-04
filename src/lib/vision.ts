// src/lib/vision.ts
// Moderador de imagem com fail-safe.
// - Aceita base64 com ou sem cabeçalho data URI
// - Limite de 5MB (igual ao front)
// - Provider selecionável por env: SAFE_VISION_PROVIDER = "google" | "openai"
// - STRICT: se algo falhar e SAFE_VISION_STRICT === "true", bloqueia; senão libera
// - Loga o motivo do bloqueio no servidor para facilitar ajuste de cortes.

export type ModResult = { blocked: boolean; reason?: string };

const BYTES_MAX = 5 * 1024 * 1024;
const STRICT = process.env.SAFE_VISION_STRICT === "true";
const PROVIDER = (process.env.SAFE_VISION_PROVIDER || "google").toLowerCase();

// ---- OPENAI (opcional) ----
const OPENAI_KEY = process.env.OPENAI_API_KEY || "";

// ---- GOOGLE SA (service account via JWT) ----
const GCP_CLIENT_EMAIL = process.env.GCP_CLIENT_EMAIL || "";
const GCP_PRIVATE_KEY_RAW = process.env.GCP_PRIVATE_KEY || "";
// corrige quebra de linha de env
const GCP_PRIVATE_KEY = GCP_PRIVATE_KEY_RAW.replace(/\\n/g, "\n");

function approxBytesFromB64(b64: string) {
  const len = b64.replace(/=+$/, "").length;
  return Math.floor((len * 3) / 4);
}

function cleanBase64(input: string) {
  const parts = String(input).split(",");
  return parts.length > 1 ? parts.slice(1).join(",") : input;
}

/* =========================================================
 * GOOGLE VISION
 * =======================================================*/
function rank(l: string | undefined) {
  switch (l) {
    case "VERY_LIKELY": return 5;
    case "LIKELY": return 4;
    case "POSSIBLE": return 3;
    case "UNLIKELY": return 2;
    case "VERY_UNLIKELY": return 1;
    default: return 0; // UNKNOWN
  }
}

/**
 * Cortes suavizados para reduzir falso-positivo:
 * bloqueia apenas quando VERY_LIKELY (5) em qualquer eixo.
 * Se quiser endurecer algum eixo, mude o corte para 4.
 */
function decideBlockGoogle(safe: {
  adult?: string; racy?: string; violence?: string; medical?: string; spoof?: string;
}) {
  const CUT_ADULT = 5;
  const CUT_RACY = 5;
  const CUT_VIOLENCE = 5;
  const CUT_MEDICAL = 5;
  const CUT_SPOOF = 5;

  const reasons: string[] = [];
  const tests: Array<[string, number, number]> = [
    ["adult", rank(safe.adult), CUT_ADULT],
    ["racy", rank(safe.racy), CUT_RACY],
    ["violence", rank(safe.violence), CUT_VIOLENCE],
    ["medical", rank(safe.medical), CUT_MEDICAL],
    ["spoof", rank(safe.spoof), CUT_SPOOF],
  ];
  for (const [k, score, cut] of tests) {
    if (score >= cut) reasons.push(`${k}=${score}`);
  }
  return { blocked: reasons.length > 0, reasons };
}

async function getGoogleAccessToken(): Promise<string> {
  // importa crypto apenas em runtime node (evita problemas de edge)
  const { createSign } = await import("node:crypto");

  if (!GCP_CLIENT_EMAIL || !GCP_PRIVATE_KEY) {
    throw new Error("missing_gcp_credentials");
  }
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: GCP_CLIENT_EMAIL,
    sub: GCP_CLIENT_EMAIL,
    aud: "https://oauth2.googleapis.com/token",
    scope: "https://www.googleapis.com/auth/cloud-platform",
    iat: now,
    exp: now + 3600,
  };

  const b64url = (obj: any) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

  const unsigned = `${b64url(header)}.${b64url(claim)}`;
  const sign = createSign("RSA-SHA256");
  sign.update(unsigned);
  sign.end();
  const sig = sign
    .sign(GCP_PRIVATE_KEY)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const assertion = `${unsigned}.${sig}`;

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!r.ok) {
    throw new Error(`gcp_token_${r.status}`);
  }
  const j = await r.json();
  return j.access_token as string;
}

async function moderateWithGoogleVision(b64payload: string): Promise<ModResult> {
  const token = await getGoogleAccessToken();

  const r = await fetch("https://vision.googleapis.com/v1/images:annotate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      requests: [
        {
          image: { content: b64payload },
          features: [{ type: "SAFE_SEARCH_DETECTION" }],
        },
      ],
    }),
  });

  if (!r.ok) {
    if (STRICT) return { blocked: true, reason: `vision_${r.status}` };
    return { blocked: false };
  }

  const j = await r.json();
  const safe = j?.responses?.[0]?.safeSearchAnnotation ?? {};
  const decision = decideBlockGoogle(safe);

  if (decision.blocked) {
    console.warn("[vision:block]", safe, decision.reasons);
    return { blocked: true, reason: decision.reasons.join(",") || "flagged" };
  }

  console.info("[vision:allow]", safe);
  return { blocked: false };
}

/* =========================================================
 * OPENAI (alternativo; usado se SAFE_VISION_PROVIDER=openai)
 * =======================================================*/
async function moderateWithOpenAI(b64payload: string): Promise<ModResult> {
  if (!OPENAI_KEY) {
    return STRICT ? { blocked: true, reason: "no_api_key" } : { blocked: false };
  }

  const r = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: "omni-moderation-latest",
      input: [
        {
          role: "user",
          content: [{ type: "input_image", image_data: b64payload }],
        },
      ],
    }),
  });

  if (!r.ok) {
    if (STRICT) return { blocked: true, reason: `provider_${r.status}` };
    return { blocked: false };
  }
  const j = await r.json();
  const flagged =
    j?.output?.[0]?.content?.[0]?.moderation?.flagged === true ||
    j?.results?.[0]?.flagged === true ||
    j?.flagged === true;

  return { blocked: !!flagged, reason: flagged ? "flagged" : undefined };
}

/* =========================================================
 * API ÚNICA
 * =======================================================*/
export async function moderateImageBase64(b64: string): Promise<ModResult> {
  try {
    if (!b64 || typeof b64 !== "string") return { blocked: true, reason: "empty" };

    const payload = cleanBase64(b64);
    const bytes = approxBytesFromB64(payload);
    if (bytes === 0) return { blocked: true, reason: "invalid_b64" };
    if (bytes > BYTES_MAX) return { blocked: true, reason: "too_big" };

    if (PROVIDER === "openai") {
      return await moderateWithOpenAI(payload);
    }
    // default = google
    return await moderateWithGoogleVision(payload);
  } catch (e) {
    console.error("[vision] moderation error", e);
    return STRICT ? { blocked: true, reason: "error" } : { blocked: false };
  }
}
