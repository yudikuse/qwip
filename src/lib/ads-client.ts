// src/lib/ads-client.ts

export type CreatePayload = {
  title: string;
  description: string;
  priceCents: number;

  // imagem (base64 já comprimido no client)
  imageBase64: string;

  // localização (obrigatórios no schema Ad)
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

// Resposta compatível com o que a page.tsx espera (estilo fetch Response-like)
export type CreateAdResponse = {
  ok: boolean;
  status: number;
  data?: { id: string };
  errorText?: string;
};

export async function createAdSecure(payload: CreatePayload): Promise<CreateAdResponse> {
  try {
    const res = await fetch('/api/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // tenta parsear JSON (sucesso ou erro)
    let parsed: any = undefined;
    try {
      parsed = await res.json();
    } catch {
      parsed = undefined;
    }

    if (res.ok) {
      // esperamos { id } no sucesso
      const id: string | undefined = parsed?.id;
      if (!id) {
        return {
          ok: false,
          status: res.status,
          errorText: 'Resposta inesperada do servidor (id ausente).',
        };
      }
      return {
        ok: true,
        status: res.status,
        data: { id },
      };
    } else {
      // no erro, servidor costuma retornar { error: "mensagem" }
      const errorText =
        typeof parsed?.error === 'string' ? parsed.error : res.statusText || 'Erro ao criar anúncio';
      return {
        ok: false,
        status: res.status,
        errorText,
      };
    }
  } catch (e: any) {
    return {
      ok: false,
      status: 0,
      errorText: typeof e?.message === 'string' ? e.message : 'Falha de rede ao criar anúncio',
    };
  }
}
