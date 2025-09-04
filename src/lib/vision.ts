// src/lib/vision.ts
// Moderador de imagem com Google Cloud Vision (REST), "fail-safe":
// - Só bloqueia quando o Vision indicar forte probabilidade.
// - Se a API falhar/faltar chave, NÃO bloqueia (a menos que STRICT esteja ligado).
// - Opção de "whitelist" para fotos de comida, para evitar falso-positivo de "racy" em panetone etc.

export type ModResult = {
  blocked: boolean;
  reason?: string;          // resumo curto (ex.: "adult>=LIKELY" | "racy>=VERY_LIKELY" | "api_error" | "invalid_b64")
  details?: unknown;        // objeto bruto (opcional; útil em logs quando DEBUG)
};

const BYTES_MAX = 5 * 1024 * 1024; // 5MB — consistente com o front

const STRICT = process.env.SAFE_VISION_STRICT === "true";            // se true, falha da API => bloqueia
const DEBUG  = process.env.SAFE_VISION_DEBUG  === "true";            // se true, inclui details em logs e pode ser exposto pelo route.ts
const WHITELIST_FOOD = process.env.SAFE_VISION_WHITELIST_FOOD === "true"; // libera "racy" se for comida

// Limiares (padrões conservadores: bloqueia ADULT/VIOLENCE >= LIKELY; RACY >= VERY_LIKELY)
const ADULT_MIN      = Number(process.env.SAFE_VISION_ADULT_MIN      ?? 4); // 4=LIKELY, 5=VERY_LIKELY
const VIOLENCE_MIN   = Number(process.env.SAFE_VISION_VIOLENCE_MIN   ?? 4);
const RACY_MIN       = Number(process.env.SAFE_VISION_RACY_MIN       ?? 5); // RACY mais estrito (muito comum falso-positivo leve)

const GCV_KEY = process.env.GOOGLE_VISION_API_KEY || process.env.GOOGLE_API_KEY || "";

/** Converte base64 (aceita "data:image/...;base64,xxx" ou payload puro) para payload puro */
function toPureBase64(b64: string) {
  const parts = String(b64 || "").split(",");
  return parts.length > 1 ? parts.slice(1).join(",") : String(b64 || "");
}

/** Estima bytes do base64 (sem considerar padding) */
function approxBytesFromB64(b64: string) {
  const len = b64.replace(/=+$/, "").length;
  return Math.floor((len * 3) / 4);
}

/** Mapeia os enums do Vision para score 0..5 */
function likelihoodToScore(x: string | undefined) {
  switch ((x || "").toUpperCase()) {
    case "UNKNOWN": return 0;
    case "VERY_UNLIKELY": return 1;
    case "UNLIKELY": return 2;
    case "POSSIBLE": return 3;
    case "LIKELY": return 4;
    case "VERY_LIKELY": return 5;
    default: return 0;
  }
}

/** Detecta se os labels indicam "comida" com confiança razoável */
function looksLikeFood(labels: Array<{ description?: string; score?: number }> | undefined) {
  if (!labels?.length) return false;
  const FOOD_KEYWORDS = [
    "Food", "Cuisine", "Baked goods", "Bread", "Dessert", "Pastry",
    "Cake", "Panettone", "Candy", "Chocolate", "Snack", "Meal",
    "Fruit", "Vegetable"
  ].map((s) => s.toLowerCase());

  return labels.some((l) => {
    const d = (l.description || "").toLowerCase();
    const ok = FOOD_KEYWORDS.some((k) => d.includes(k));
    return ok && (l.score ?? 0) >= 0.70;
  });
}

export async function moderateImageBase64(b64: string): Promise<ModResult> {
  try {
    if (!b64 || typeof b64 !== "string") {
      return { blocked: true, reason: "empty" };
    }

    const payload = toPureBase64(b64);
    const size = approxBytesFromB64(payload);
    if (size === 0) return { blocked: true, reason: "invalid_b64" };
    if (size > BYTES_MAX) return { blocked: true, reason: "too_big" };

    // Sem chave → não bloqueia (a menos que STRICT)
    if (!GCV_KEY) {
      if (DEBUG) console.warn("[vision] no GOOGLE_VISION_API_KEY set");
      return STRICT ? { blocked: true, reason: "no_api_key" } : { blocked: false };
    }

    // Chamada ao Vision: SafeSearch + Labels
    const resp = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(GCV_KEY)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // content deve ser base64 puro (sem header data:)
        body: JSON.stringify({
          requests: [
            {
              image: { content: payload },
              features: [
                { type: "SAFE_SEARCH_DETECTION" },
                { type: "LABEL_DETECTION", maxResults: 10 },
              ],
            },
          ],
        }),
      }
    );

    if (!resp.ok) {
      if (DEBUG) console.error("[vision] provider_non_ok", resp.status, await safeText(resp));
      return STRICT ? { blocked: true, reason: `provider_${resp.status}` } : { blocked: false };
    }

    const json = await resp.json();

    const annotation = json?.responses?.[0] || {};
    const safe = annotation.safeSearchAnnotation || {};
    const labels = annotation.labelAnnotations || [];

    const adult = likelihoodToScore(safe.adult);
    const racy = likelihoodToScore(safe.racy);
    const violence = likelihoodToScore(safe.violence);
    const medical = likelihoodToScore(safe.medical);   // geralmente não usamos pra bloquear
    const spoof = likelihoodToScore(safe.spoof);       // idem

    // Regras de bloqueio
    let blocked = false;
    let reason: string | undefined;

    if (adult >= ADULT_MIN) { blocked = true; reason = `adult>=${scoreName(adult)}`; }
    if (!blocked && violence >= VIOLENCE_MIN) { blocked = true; reason = `violence>=${scoreName(violence)}`; }
    if (!blocked && racy >= RACY_MIN) { blocked = true; reason = `racy>=${scoreName(racy)}`; }

    // Whitelist para comida: se só caiu por "racy" e é comida, libera.
    if (blocked && reason?.startsWith("racy>=") && WHITELIST_FOOD && looksLikeFood(labels)) {
      blocked = false;
      reason = undefined;
    }

    if (DEBUG) {
      console.log("[vision:decision]", {
        safe: { adult, racy, violence, medical, spoof },
        labels: labels?.slice(0, 5)?.map((l: any) => ({ d: l.description, s: l.score })),
        blocked, reason,
      });
    }

    return { blocked, reason, details: DEBUG ? { safe, labels } : undefined };
  } catch (e) {
    console.error("[vision] moderation error", e);
    return STRICT ? { blocked: true, reason: "api_error" } : { blocked: false };
  }
}

/** Utilitário para loggar resposta de erro sem quebrar streaming */
async function safeText(r: Response) {
  try { return await r.text(); } catch { return "<no-body>"; }
}
function scoreName(n: number) {
  return ["UNKNOWN","VERY_UNLIKELY","UNLIKELY","POSSIBLE","LIKELY","VERY_LIKELY"][Math.max(0, Math.min(5, n))];
}
