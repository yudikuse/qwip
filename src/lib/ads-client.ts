// src/lib/ads-client.ts

/** Payload que o backend espera para criar um anúncio */
export type NewAdPayload = {
  title: string;
  description: string;
  priceCents: number;

  city?: string;
  uf?: string;

  lat: number | null;
  lng: number | null;
  centerLat: number | null;
  centerLng: number | null;

  radiusKm: number;

  /** imagem em base64 (APENAS o conteúdo, sem "data:image/...;base64,") */
  imageBase64: string;
};

type JsonOk<T> = { ok: true; status: number; data: T };
type JsonErr = { ok: false; status: number; data: any };

async function toJson<T>(res: Response): Promise<JsonOk<T> | JsonErr> {
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // sem body json
  }
  if (!res.ok) return { ok: false, status: res.status, data };
  return { ok: true, status: res.status, data };
}

/** Pede um nonce ao servidor (rate-limited por IP/cookie) */
export async function fetchNonce() {
  const res = await fetch("/api/ads/nonce", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ts: Date.now() }), // payload mínimo
    cache: "no-store",
    credentials: "same-origin",
  });
  return toJson<{ nonce: string; retryAfterSec?: number }>(res);
}

/**
 * Cria o anúncio com proteção:
 * 1) busca um NONCE
 * 2) envia o payload com header X-QWIP-NONCE
 * Cookies de sessão são enviados automaticamente (mesma origem).
 */
export async function createAdSecure(payload: NewAdPayload) {
  // guarda-chuva de validação rápida no cliente
  if (!payload.imageBase64) {
    return {
      ok: false as const,
      status: 400,
      data: { error: "Imagem obrigatória." },
    };
  }

  const nonceRes = await fetchNonce();
  if (!nonceRes.ok) return nonceRes as JsonErr;

  const res = await fetch("/api/ads", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-qwip-nonce": nonceRes.data.nonce,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
    credentials: "same-origin",
  });

  return toJson<{ id: string }>(res);
}
