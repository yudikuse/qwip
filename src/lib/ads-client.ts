// src/lib/ads-client.ts

export type CreatePayload = {
  title: string;
  description: string;
  priceCents: number;
  city: string;
  uf: string;
  lat: number;
  lng: number;
  radiusKm: number;
  imageBase64: string; // data URL (base64) da imagem
};

/**
 * Resultado “Response-like” para ser compatível com page.tsx
 * (evita quebrar a checagem res.ok / res.status).
 */
export type CreateAdResult =
  | { ok: true; status: number; data: { id: string } }
  | { ok: false; status: number; errorText?: string; data?: unknown };

/**
 * Cria um anúncio chamando a rota /api/ads.
 * Sempre retorna um objeto do tipo CreateAdResult.
 */
export async function createAdSecure(
  body: CreatePayload
): Promise<CreateAdResult> {
  try {
    const res = await fetch("/api/ads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // Importante: nunca envie centerLat/centerLng aqui.
      body: JSON.stringify(body),
      cache: "no-store",
    });

    // Tenta decodificar JSON (pode falhar em erros 500 sem body)
    let json: any = undefined;
    try {
      json = await res.clone().json();
    } catch (_) {
      /* ignore */
    }

    if (!res.ok) {
      const errorText =
        (json && (json.error || json.message || json.errorText)) ??
        `HTTP ${res.status}`;
      return { ok: false, status: res.status, errorText, data: json };
    }

    // Espera { id: string } no sucesso
    const id = json?.id as string | undefined;
    if (!id) {
      return {
        ok: false,
        status: res.status,
        errorText: "Resposta sem id do anúncio.",
        data: json,
      };
    }

    return { ok: true, status: res.status, data: { id } };
  } catch (e: any) {
    return {
      ok: false,
      status: 0,
      errorText: e?.message ?? "Falha de rede inesperada",
    };
  }
}

/* Utilidades opcionais */

export async function getAd(id: string) {
  const res = await fetch(`/api/ads/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Falha ao buscar anúncio: ${res.status}`);
  return (await res.json()) as unknown;
}

export async function listAds(params?: Record<string, string | number>) {
  const qs = params
    ? "?" +
      Object.entries(params)
        .map(
          ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
        )
        .join("&")
    : "";
  const res = await fetch(`/api/ads${qs}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Falha ao listar anúncios: ${res.status}`);
  return (await res.json()) as unknown;
}
