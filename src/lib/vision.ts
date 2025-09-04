// src/lib/vision.ts
import vision from "@google-cloud/vision";

const client = new vision.ImageAnnotatorClient({
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  projectId: process.env.GCP_PROJECT_ID,
});

/**
 * Roda SafeSearch + Label juntos (mantém SafeSearch grátis quando Label é usado).
 * @returns { blocked } => true se reprovar (adult/violence/racy ou label da blocklist)
 */
export async function moderateImageBase64(imageBase64: string) {
  if (!imageBase64) return { blocked: true, reason: "missing" as const };

  const [res] = await client.annotateImage({
    image: { content: Buffer.from(imageBase64, "base64") },
    features: [
      { type: "SAFE_SEARCH_DETECTION" },
      { type: "LABEL_DETECTION", maxResults: 8 },
    ],
  });

  const safe = res.safeSearchAnnotation;
  const labels = (res.labelAnnotations ?? []).map(l => (l.description || "").toLowerCase());

  const bad = (v?: string) => ["LIKELY", "VERY_LIKELY"].includes(String(v));
  const blockedBySafe = bad(safe?.adult) || bad(safe?.violence) || bad(safe?.racy);

  const denyTerms = (process.env.VISION_BLOCKLIST_LABELS || "")
    .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  const blockedByLabel = denyTerms.length ? labels.some(l => denyTerms.includes(l)) : false;

  return { blocked: blockedBySafe || blockedByLabel, safe, labels };
}
