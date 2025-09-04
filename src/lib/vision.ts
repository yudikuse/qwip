// src/lib/vision.ts

/**
 * Import dinâmico do Google Vision para rodar apenas no Node (rotas server).
 * SafeSearch + Label (SafeSearch fica grátis quando Label é usado).
 */
export async function moderateImageBase64(imageBase64: string) {
  if (!imageBase64) return { blocked: true as const, reason: "missing" as const };

  const vision = await import("@google-cloud/vision");
  const client = new vision.ImageAnnotatorClient({
    credentials: {
      client_email: process.env.GCP_CLIENT_EMAIL,
      private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    projectId: process.env.GCP_PROJECT_ID,
  });

  const [res] = await client.annotateImage({
    image: { content: Buffer.from(imageBase64, "base64") },
    features: [
      { type: "SAFE_SEARCH_DETECTION" },
      { type: "LABEL_DETECTION", maxResults: 8 },
    ],
  });

  const safe = res.safeSearchAnnotation ?? {};
  const labels = (res.labelAnnotations ?? []).map(
    (l) => (l.description ?? "").toLowerCase()
  );

  // Converte qualquer coisa para string antes de comparar
  const isBad = (v: unknown) =>
    ["LIKELY", "VERY_LIKELY"].includes(String(v ?? ""));

  const blockedBySafe =
    isBad((safe as any).adult) ||
    isBad((safe as any).violence) ||
    isBad((safe as any).racy);

  const denyTerms = (process.env.VISION_BLOCKLIST_LABELS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const blockedByLabel =
    denyTerms.length > 0 ? labels.some((l) => denyTerms.includes(l)) : false;

  return { blocked: blockedBySafe || blockedByLabel, safe, labels };
}
