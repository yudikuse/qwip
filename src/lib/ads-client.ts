'use client';

// src/lib/ads-client.ts
// Client para criar anúncio com NONCE, com redução automática da imagem
// e mensagens amigáveis em PT-BR.

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
  imageBase64: string; // dataURL base64
};

export type CreateAdResp =
  | { ok: true; status: number; data: { id: string } }
  | { ok: false; status: number; errorText: string; data?: any };

// ===== Helpers de imagem (redução automática para evitar 413) =====
const MAX_BYTES = 3_800_000; // ~3.8MB (abaixo do limite da Vercel, margem de segurança)

function dataURLByteLength(dataURL: string): number {
  const comma = dataURL.indexOf(',');
  const base64 = comma >= 0 ? dataURL.slice(comma + 1) : dataURL;
  const len = base64.length;
  // estimativa de bytes do base64
  return Math.floor((len * 3) / 4) - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
}

function loadImageFromDataURL(dataURL: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = dataURL;
  });
}

function canvasToDataURL(
  canvas: HTMLCanvasElement,
  mime: 'image/jpeg' | 'image/png',
  quality: number
): string {
  // Safari costuma respeitar quality em JPEG. Preferimos JPEG.
  return canvas.toDataURL(mime, quality);
}

async function shrinkDataURLIfNeeded(
  dataURL: string,
  maxBytes = MAX_BYTES
): Promise<string> {
  if (!dataURL || dataURLByteLength(dataURL) <= maxBytes) return dataURL;

  // Converte tudo para JPEG e vai reduzindo tamanho/qualidade aos poucos
  const img = await loadImageFromDataURL(dataURL);

  let w = img.naturalWidth || img.width || 0;
  let h = img.naturalHeight || img.height || 0;
  if (!w || !h) return dataURL; // fallback

  // Limite máximo de dimensão para não explodir memória (ajuste fino se quiser)
  const MAX_DIM = 1600;
  const scale0 = Math.min(1, MAX_DIM / Math.max(w, h));
  w = Math.round(w * scale0);
  h = Math.round(h * scale0);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataURL;

  let quality = 0.85;
  let attempts = 0;
  let out = dataURL;

  while (attempts < 6) {
    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    out = canvasToDataURL(canvas, 'image/jpeg', quality);

    if (dataURLByteLength(out) <= maxBytes) break;

    // reduz um pouco resolução e qualidade a cada tentativa
    w = Math.round(w * 0.92);
    h = Math.round(h * 0.92);
    quality = Math.max(0.6, quality * 0.92);
    attempts += 1;
  }

  return out;
}

// ===== Helpers de NONCE + mensagens =====
async function fetchNonce(): Promise<string> {
  const r = await fetch('/api/ads/nonce', {
    method: 'GET',
    credentials: 'include',
    headers: { 'Cache-Control': 'no-store' },
  });

  let j: any = null;
  try { j = await r.json(); } catch { /* ok, tenta header */ }

  const ok = j?.ok === true || r.ok;
  const headerNonce = r.headers.get('X-Qwip-Nonce') || r.headers.get('x-qwip-nonce');
  const bodyNonce = j?.nonce || j?.token;
  const nonce = bodyNonce || headerNonce || '';

  if (!ok || !nonce) {
    throw new Error(`Falha ao iniciar publicação (nonce). Código ${r.status}.`);
  }
  return String(nonce);
}

function humanizeError(status: number, body: any): string {
  // Mensagens amigáveis em PT-BR
  if (status === 413) {
    return 'A imagem é muito grande para envio. Reduza a foto ou tente novamente (tamanho máximo ~4 MB).';
  }
  if (status === 422 && body?.code === 'image_blocked') {
    // body.reason pode vir como "adult>=VERY_LIKELY" ou já PT
    const reason = typeof body.reason === 'string' ? body.reason : '';
    return `Imagem reprovada pela moderação: ${reason || 'conteúdo impróprio detectado.'} Troque a imagem.`;
  }
  if (status === 400 && body?.code === 'moderation_failed') {
    return 'Não foi possível verificar a imagem agora. Tente novamente em alguns instantes.';
  }
  if (status === 401) {
    return 'Sua sessão expirou. Faça a verificação por SMS novamente.';
  }
  if (status === 429) {
    return 'Muitas tentativas em pouco tempo. Aguarde um instante e tente de novo.';
  }
  // genérico
  return 'Não foi possível publicar o anúncio agora. Tente novamente.';
}

// ===== API =====
export async function createAd(payload: CreatePayload): Promise<CreateAdResp> {
  try {
    // 0) Reduz a imagem para evitar 413 (caso exista)
    const imageBase64Optim =
      payload.imageBase64 ? await shrinkDataURLIfNeeded(payload.imageBase64, MAX_BYTES) : '';

    // 1) NONCE
    const nonce = await fetchNonce();

    // 2) POST do anúncio com NONCE
    const r = await fetch('/api/ads', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-QWIP-NONCE': nonce, // case-insensitive
      },
      body: JSON.stringify({ ...payload, imageBase64: imageBase64Optim }),
    });

    const j = await r.json().catch(() => null);

    if (!r.ok || !j?.ok) {
      return {
        ok: false,
        status: r.status,
        data: j,
        errorText: humanizeError(r.status, j),
      };
    }

    return { ok: true, status: r.status, data: { id: j.id } };
  } catch (e: any) {
    return { ok: false, status: 0, errorText: e?.message || 'Falha de rede.' };
  }
}

// Alias antigo (compat com page.tsx)
export const createAdSecure = createAd;
