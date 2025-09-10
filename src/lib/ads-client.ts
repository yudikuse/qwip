// src/lib/ads-client.ts
export type CreatePayload = {
  title: string;
  description: string;
  priceCents: number;
  city: string;
  uf: string;
  lat: number;
  lng: number;

  // Campos que o seu form já envia e que também aparecem no registro do anúncio:
  centerLat: number;
  centerLng: number;
  radiusKm: number;

  // imagem inline (Base64 sem prefixo data:)
  imageBase64: string;

  // opcional: mime, se quiser forçar
  imageMime?: string;
};

// Resposta “padrão” para o app todo
export type ClientResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; errorText?: string; data?: any };

export async function createAdSecure(
  payload: CreatePayload
): Promise<ClientResult<{ id: string }>> {
  try {
    const res = await fetch("/api/ads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // IMPORTANTÍSSIMO: mantenha os cookies (telefone verificado etc.)
      credentials: "include",
      body: JSON.stringify(payload),
    });

    // Tenta decodificar JSON (pode vir erro estruturado do route handler)
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      // pode ser vazio
      data = null;
    }

    if (!res.ok) {
      const msg =
        (data && (data.error || data.message)) ||
        `Falha (${res.status}) ao criar anúncio`;
      return { ok: false, status: res.status, errorText: msg, data };
    }

    // esperamos { id } quando ok
    const id: string | undefined = data?.id;
    if (!id) {
      return {
        ok: false,
        status: res.status,
        errorText: "Resposta sem ID do anúncio.",
        data,
      };
    }

    return { ok: true, status: res.status, data: { id } };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      errorText: err?.message || "Erro de rede ao criar anúncio.",
    };
  }
}
