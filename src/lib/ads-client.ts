// src/lib/ads-client.ts
export type CreateAdPayload = Record<string, any>;

export async function createAdSecure(payload: CreateAdPayload) {
  // 1) Pega nonce válido (expira em ~2min)
  const n = await fetch('/api/ads/nonce', { cache: 'no-store' });
  if (!n.ok) throw new Error('Falha ao obter nonce');
  const { nonce } = await n.json();

  // 2) Envia anúncio com o nonce assinado
  const r = await fetch('/api/ads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-QWIP-NONCE': nonce,
    },
    body: JSON.stringify(payload),
  });

  // Opcional: tratar 401/429 aqui se quiser
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}
