// src/lib/ads-client.ts

export type CreatePayload = {
  title: string;
  description: string;
  priceCents: number;

  // imagem (base64 já comprimido no client)
  imageBase64: string;

  // localização (obrigatórios no seu schema)
  city: string;
  uf: string;
  lat: number;
  lng: number;

  // opcionais (existem no schema, mas não são required)
  centerLat?: number | null;
  centerLng?: number | null;
  radiusKm?: number | null;

  // se você usa expiração no anúncio
  expiresAt?: string | null; // ISO (ex.: "2025-12-31T23:59:59.000Z")
};

export async function createAdSecure(payload: CreatePayload): Promise<{ id: string }> {
  const res = await fetch('/api/ads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = 'Falha ao criar anúncio.';
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {}
    throw new Error(message);
  }

  return res.json();
}
