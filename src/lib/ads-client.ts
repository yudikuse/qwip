// src/lib/ads-client.ts
export type CreatePayload = {
  title: string;
  description: string;
  priceCents: number;
  city: string | null;
  uf: string | null;
  lat: number | null;
  lng: number | null;
  centerLat: number | null;
  centerLng: number | null;
  radiusKm: number;
  imageBase64: string;
};

export type CreateAdResp =
  | { ok: true; status: number; data: { id: string } }
  | { ok: false; status: number; errorText: string; data?: any };

export async function createAd(payload: CreatePayload): Promise<CreateAdResp> {
  try {
    // 1) Pega NONCE
    const n = await fetch("/api/ads/nonce", {
      method: "GET",
      credentials: "include",
      headers: { "Cache-Control": "no-store" },
    });

    let nJson: any = null;
    try {
      nJson = await n.json();
    } catch {
      // segue; podemos pegar do header
    }

    if (!n.ok || !nJson?.ok) {
      return {
        ok: false,
        status: n.status,
        data: nJson,
        errorText: `nonce error: ${n.status} ${JSON.stringify(nJson)}`,
      };
    }

    // aceita tanto 'nonce' quanto 'token' quanto o header
    const nonce =
      (nJson && (nJson.nonce || nJson.token)) ||
      n.headers.get("X-Qwip-Nonce") ||
      n.headers.get("x-qwip-nonce");

    if (!nonce) {
      return {
        ok: false,
        status: n.status,
        data: nJson,
        errorText: `nonce error: ${n.status} ${JSON.stringify(nJson)}`,
      };
    }

    // 2) POST do anúncio usando o NONCE
    const r = await fetch("/api/ads", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        // Header name é case-insensitive; mantemos como o backend espera:
        "X-QWIP-NONCE": String(nonce),
      },
      body: JSON.stringify(payload),
    });

    const j = await r.json().catch(() => null);

    if (!r.ok || !j?.ok) {
      return {
        ok: false,
        status: r.status,
        data: j,
        errorText: `ads error: ${r.status} ${JSON.stringify(j)}`,
      };
    }

    return { ok: true, status: r.status, data: { id: j.id } };
  } catch (e: any) {
    return { ok: false, status: 0, errorText: e?.message || "network error" };
  }
}
