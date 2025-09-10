// src/lib/ads-client.ts

export type ApiResult<T> = {
  ok: boolean;
  status: number;
  data?: T;
  errorText?: string;
};

export type CreatePayload = {
  title: string;
  description: string;
  priceCents: number;
  city: string;
  uf: string;
  lat: number;
  lng: number;
  radiusKm: number;
  // quando usar JSON, a imagem vai em base64
  imageBase64?: string;
};

// Utilitário: resolve a base (permite rodar em dev e prod)
function getBaseUrl() {
  // Se houver base pública configurada, usa; senão, caminho relativo
  if (typeof window === "undefined") {
    // ambiente server — use a env pública se existir
    return process.env.NEXT_PUBLIC_BASE_URL || "";
  }
  return "";
}

// Normaliza Response -> ApiResult<T>
async function toApiResult<T>(res: Response): Promise<ApiResult<T>> {
  const contentType = res.headers.get("content-type") || "";
  let data: any = undefined;

  try {
    if (contentType.includes("application/json")) {
      data = await res.json();
    } else if (contentType.includes("text/")) {
      const txt = await res.text();
      data = { message: txt };
    }
  } catch {
    // ignora parse error, seguimos com data = undefined
  }

  if (res.ok) {
    return { ok: true, status: res.status, data };
  } else {
    const errorText =
      (data && (data.error || data.message)) ||
      `HTTP ${res.status}`;
    return { ok: false, status: res.status, data, errorText };
  }
}

/**
 * Cria anúncio usando JSON (imagem em base64).
 * Útil para imagens pequenas; para evitar 413, prefira multipart abaixo.
 */
export async function createAdSecure(
  payload: CreatePayload,
  opts: Partial<RequestInit> = {}
): Promise<ApiResult<{ id: string }>> {
  const url = `${getBaseUrl()}/api/ads`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(opts.headers || {}),
    },
    credentials: "include", // precisa do cookie do telefone verificado
    body: JSON.stringify(payload),
    ...opts,
  });

  return toApiResult<{ id: string }>(res);
}

/**
 * Cria anúncio usando multipart/form-data (arquivo binário).
 * Aceita segundo parâmetro opcional (para compatibilidade com seu page.tsx).
 * Ex.: createAdSecureForm(form, {})
 */
export async function createAdSecureForm(
  form: FormData,
  opts: Partial<RequestInit> = {}
): Promise<ApiResult<{ id: string }>> {
  const url = `${getBaseUrl()}/api/ads`;

  // NÃO definir manualmente Content-Type; o browser define boundary do multipart
  const res = await fetch(url, {
    method: "POST",
    body: form,
    credentials: "include", // precisa do cookie do telefone verificado
    ...opts,
  });

  return toApiResult<{ id: string }>(res);
}
