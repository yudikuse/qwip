// src/lib/ads-client.ts
export type CreateFields = {
  title: string;
  description: string;
  priceCents: number;
  city: string;
  uf: string;
  lat: number;
  lng: number;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
};

export type CreateResponse =
  | { ok: true; status: number; data: { id: string } }
  | { ok: false; status: number; errorText?: string; data?: any };

function toQuery(base: string) {
  // útil quando precisarmos adicionar query no futuro
  return base;
}

export async function createAdSecureForm(
  fields: CreateFields,
  file: File
): Promise<CreateResponse> {
  const fd = new FormData();
  fd.append("title", fields.title);
  fd.append("description", fields.description);
  fd.append("priceCents", String(fields.priceCents));
  fd.append("city", fields.city);
  fd.append("uf", fields.uf);
  fd.append("lat", String(fields.lat));
  fd.append("lng", String(fields.lng));
  fd.append("centerLat", String(fields.centerLat));
  fd.append("centerLng", String(fields.centerLng));
  fd.append("radiusKm", String(fields.radiusKm));
  fd.append("image", file, file.name);

  const res = await fetch(toQuery("/api/ads"), {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    let data: any;
    try { data = await res.json(); } catch {}
    return { ok: false, status: res.status, errorText: data?.error || data?.message, data };
  }

  const data = (await res.json()) as { id: string };
  return { ok: true, status: res.status, data };
}
