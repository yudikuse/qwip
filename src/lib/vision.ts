// src/lib/vision.ts
// Módulo de moderação de imagem "fail-safe": nunca lança erro.
// Bloqueia somente quando o provedor responder com "flagged".
// Se faltar chave/API falhar, por padrão NÃO bloqueia (modo estrito via env).

export type ModResult = { blocked: boolean; reason?: string };

const BYTES_MAX = 5 * 1024 * 1024; // 5MB (coerente com o front)
const STRICT = process.env.SAFE_VISION_STRICT === "true";
const OPENAI_KEY = process.env.OPENAI_API_KEY || "";

/** Valida base64 simples (sem MIME header) e estima bytes */
function approxBytesFromB64(b64: string) {
  // ignora padding
  const len = b64.replace(/=+$/, "").length;
  return Math.floor((len * 3) / 4);
}

export async function moderateImageBase64(b64: string): Promise<ModResult> {
  try {
    if (!b64 || typeof b64 !== "string") {
      return { blocked: true, reason: "empty" };
    }

    // aceita tanto payload “puro” quanto um "data:image/...;base64,...."
    const parts = b64.split(",");
    const payload = parts.length > 1 ? parts.slice(1).join(",") : b64;

    // tamanho (aproximado) — mesmo limite do front
    const bytes = approxBytesFromB64(payload);
    if (bytes === 0) return { blocked: true, reason: "invalid_b64" };
    if (bytes > BYTES_MAX) return { blocked: true, reason: "too_big" };

    // Se não há chave, não bloqueia (a não ser no modo estrito)
    if (!OPENAI_KEY) {
      return STRICT ? { blocked: true, reason: "no_api_key" } : { blocked: false };
    }

    // ======= MODERAÇÃO =======
    // Para imagens, use o modelo omni de moderação via /responses (mais tolerante)
    // Sem dependências de SDK para evitar bundling no edge.
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "omni-moderation-latest",
        input: [
          { role: "user", content: [
              { type: "input_image", image_data: payload } // base64 puro
            ]
          }
        ],
      }),
    });

    // Qualquer falha da API -> não bloqueia (a não ser no modo estrito)
    if (!r.ok) {
      if (STRICT) return { blocked: true, reason: `provider_${r.status}` };
      return { blocked: false };
    }

    const j = await r.json();
    // Estrutura genérica: procure um campo "output"/"results"/"flagged"
    // Como isso varia entre versões, adotamos heurística segura:
    const flagged =
      j?.output?.[0]?.content?.[0]?.moderation?.flagged === true ||
      j?.results?.[0]?.flagged === true ||
      j?.flagged === true;

    return { blocked: !!flagged, reason: flagged ? "flagged" : undefined };
  } catch (e) {
    console.error("[vision] moderation error", e);
    return STRICT ? { blocked: true, reason: "error" } : { blocked: false };
  }
}
