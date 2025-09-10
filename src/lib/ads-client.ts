// src/lib/ads-client.ts

export type CreatePayload = {
  // dados obrigatórios do anúncio
  title: string;
  description: string;
  priceCents: number;

  // localização mínima
  city: string;
  uf: string;
  lat: number;
  lng: number;

  // alcance / área - opcionais (o server pode derivar/validar)
  radiusKm?: number;
  centerLat?: number;
  centerLng?: number;

  // imagem vai em base64 para moderação no server
  imageBase64: string;

  // metadados de imagem opcionais (o server pode preencher/validar)
  imageMime?: string;
  imageWidth?: number;
  imageHeight?: number;
};

/**
 * Envia o anúncio para a API. O server:
 *  - modera a imagem
 *  - salva a imagem no storage
 *  - grava o Ad no banco
 * Retorna: { id: string }
 */
export async function createAdSecure(payload: CreatePayload): Promise<{ id: string }> {
  const res = await fetch("/api/ads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    // tenta extrair um texto de erro útil; se não der, retorna status
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      /* ignore */
    }
    throw new Error(`Falha ao criar anúncio (status ${res.status})${detail ? `: ${detail}` : ""}`);
  }

  // A rota retorna { id: string }
  return res.json() as Promise<{ id: string }>;
}
