// src/lib/ads-client.ts
type CreateAdBody = {
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
  | { ok: false; status: number; data?: any; errorText?: string };

export async function createAdSecure(body: CreateAdBody): Promise<CreateAdResp> {
  try {
    // 1) pega o nonce (tem que voltar 200)
    const n = await fetch("/api/ads/nonce", { method: "GET", credentials: "include" });
    let nJson: any = null;
    try { nJson = await n.json(); } catch {}

    if (!n.ok || !nJson?.nonce) {
      return {
        ok: false,
        status: n.status,
        data: nJson,
        errorText: `nonce error: ${n.status} ${JSON.stringify(nJson)}`,
      };
    }

    // 2) envia o anúncio
    const r = await fetch("/api/ads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-QWIP-NONCE": String(nJson.nonce),
      },
      credentials: "include",
      body: JSON.stringify(body),
    });

    let j: any = null;
    try { j = await r.json(); } catch {}

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
