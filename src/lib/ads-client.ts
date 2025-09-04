// src/lib/ads-client.ts
// Cliente que obtém nonce e publica o anúncio com cabeçalho X-QWIP-NONCE.

export type CreatePayload = {
  title: string;
  description: string;
  priceCents: number;
  city: string;
  uf?: string;
  lat: number;
  lng: number;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  imageBase64: string;
};

type RespOk = { ok: true; status: number; data: any };
type RespErr = { ok: false; status: number; data?: any; errorText?: string };
export type CreateAdResp = RespOk | RespErr;

async function parseResponse(res: Response): Promise<{ data?: any; errorText?: string }> {
  const ct = res.headers.get("content-type") || "";
  try {
    if (ct.includes("application/json")) {
      const j = await res.json();
      return { data: j };
    }
    const t = await res.text();
    return { errorText: t?.slice(0, 1000) || undefined };
  } catch {
    return { errorText: "Falha ao ler resposta do servidor." };
  }
}

export async function createAdSecure(payload: CreatePayload): Promise<CreateAdResp> {
  try {
    // 1) Nonce
    const n = await fetch("/api/ads/nonce", {
      method: "POST",
      headers: { "content-type": "application/json" },
    });
    if (!n.ok) {
      const { data, errorText } = await parseResponse(n);
      return { ok: false, status: n.status, data, errorText: errorText || "Falha ao obter nonce." };
    }
    const nonceJson = await n.json(); // { nonce: string }
    const nonce = nonceJson?.nonce;
    if (!nonce) return { ok: false, status: 500, errorText: "Nonce ausente." };

    // 2) Publica
    const res = await fetch("/api/ads", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-qwip-nonce": String(nonce),
      },
      body: JSON.stringify(payload),
    });

    const { data, errorText } = await parseResponse(res);
    if (!res.ok) return { ok: false, status: res.status, data, errorText };
    return { ok: true, status: res.status, data };
  } catch (e: any) {
    return { ok: false, status: 0, errorText: e?.message || "Erro de rede." };
  }
}
