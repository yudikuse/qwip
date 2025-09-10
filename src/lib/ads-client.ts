'use client';

/**
 * Payload que a página /anuncio/novo envia para a API.
 * Ajuste os campos se no seu formulário tiverem nomes diferentes.
 */
export type CreatePayload = {
  title: string;
  description: string;
  priceCents: number;
  city: string;
  uf: string;
  lat: number;
  lng: number;
  radiusKm: number;
  imageBase64: string; // data sem prefixo; apenas base64 da imagem
  nonce: string;       // nonce anti-CSRF que você já gera no cliente
};

/**
 * Resultado padronizado (estilo Response) para a UI não quebrar.
 */
export type CreateResult = {
  ok: boolean;
  status: number;
  data?: { id: string };
  errorText?: string;
};

/**
 * Chama a API /api/ads e devolve um objeto padronizado.
 * A UI pode checar res.ok, res.status, res.data?.id, res.errorText.
 */
export async function createAdSecure(payload: CreatePayload): Promise<CreateResult> {
  try {
    const res = await fetch('/api/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // tenta ler JSON; se não for JSON, tenta texto
    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    let body: any = null;
    try {
      body = isJson ? await res.json() : await res.text();
    } catch {
      body = null;
    }

    if (!res.ok) {
      const msg =
        (body && (body.error || body.message)) ||
        res.statusText ||
        'Erro desconhecido';
      return { ok: false, status: res.status, errorText: msg };
    }

    const id: string | undefined = body && body.id ? String(body.id) : undefined;
    return { ok: true, status: res.status, data: id ? { id } : undefined };
  } catch (err: any) {
    return { ok: false, status: 0, errorText: err?.message || 'network-error' };
  }
}
