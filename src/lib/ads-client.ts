// src/lib/ads-client.ts
// Client para criar anúncio com proteção por NONCE.
// Exporta tanto createAd quanto createAdSecure (alias para compat com page.tsx).

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

async function fetchNonce(): Promise<string> {
  const r = await fetch("/api/ads/nonce", {
    method: "GET",
    credentials: "include",
    headers: { "Cache-Control": "no-store" },
  });

  let j: any = null;
  try {
    j = await r.json();
  } catch {
    // segue: podemos recuperar do header mesmo sem JSON
  }

  // aceita { ok:true, nonce } OU { ok:true, token } OU header
  const ok = j?.ok === true || r.ok;
  const headerNonce = r.headers.get("X-Qwip-Nonce") || r.headers.get("x-qwip-nonce");
  const bodyNonce = j?.nonce || j?.token;

  const nonce = bodyNonce || headerNonce || "";

  if (!ok || !nonce) {
    throw new Error(`nonce error: ${r.status} ${JSON.stringify(j)}`);
  }
  return String(nonce);
}

export async function createAd(payload: CreatePayload): Promise<CreateAdResp> {
  try {
    const nonce = await fetchNonce();

    const r = await fetch("/api/ads", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        // Header é case-insensitive; usamos o nome esperado pelo backend
        "X-QWIP-NONCE": nonce,
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

    // backend deve devolver { ok:true, id: "<id>" }
    return { ok: true, status: r.status, data: { id: j.id } };
  } catch (e: any) {
    return { ok: false, status: 0, errorText: e?.message || "network error" };
  }
}

// Alias de compatibilidade com a página atual
export const createAdSecure = createAd;
