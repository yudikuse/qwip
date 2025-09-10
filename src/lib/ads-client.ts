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
  image?: File; // opcional: envio direto
};

/**
 * Cria anúncio via FormData (binário seguro).
 * Usado na página de criar anúncio para enviar imagem e dados.
 */
export async function createAdSecureForm(form: FormData) {
  const res = await fetch("/api/ads", {
    method: "POST",
    body: form,
  });

  let data: any = undefined;
  try {
    data = await res.json();
  } catch {
    /* ignora se não for JSON */
  }

  return {
    ok: res.ok,
    status: res.status,
    data,
    errorText: !res.ok ? (data?.error || data?.message || res.statusText) : undefined,
  };
}

/**
 * Helper para montar um FormData a partir do payload tipado.
 */
export async function createAdFromPayload(payload: CreatePayload) {
  const form = new FormData();
  form.append("title", payload.title);
  form.append("description", payload.description);
  form.append("priceCents", String(payload.priceCents));
  form.append("city", payload.city);
  form.append("uf", payload.uf);
  form.append("lat", String(payload.lat));
  form.append("lng", String(payload.lng));
  form.append("radiusKm", String(payload.radiusKm));
  if (payload.image) {
    form.append("image", payload.image, payload.image.name);
  }

  return createAdSecureForm(form);
}
