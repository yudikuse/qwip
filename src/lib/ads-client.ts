// src/lib/ads-client.ts

export type CreateAdInput = {
  title: string;
  description: string;
  priceCents: number;
  imageBase64: string; // base64 já comprimido client-side
};

export async function createAd(input: CreateAdInput): Promise<{ id: string }> {
  const res = await fetch('/api/ads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
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
