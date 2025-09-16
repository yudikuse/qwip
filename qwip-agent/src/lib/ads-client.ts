// src/lib/ads-client.ts
// Cliente do browser para criar anúncio via multipart/form-data

export type CreateFormResponse =
  | { ok: true; status: number; data: { id: string } }
  | { ok: false; status: number; data?: any; errorText?: string };

function getBaseURL() {
  // Usa a base pública se houver, senão relativo
  if (typeof window !== "undefined") return "";
  return process.env.NEXT_PUBLIC_BASE_URL || "";
}

/**
 * Envia os campos + arquivo via multipart para /api/ads
 * Aceita APENAS 1 argumento (o FormData).
 */
export async function createAdSecureForm(form: FormData): Promise<CreateFormResponse> {
  try {
    const res = await fetch(`${getBaseURL()}/api/ads`, {
      method: "POST",
      body: form,
      // Não defina Content-Type manualmente para multipart — o browser cuida do boundary
      credentials: "include",
      cache: "no-store",
    });

    const status = res.status;
    const ct = res.headers.get("content-type") || "";
    let data: any = undefined;

    if (ct.includes("application/json")) {
      try {
        data = await res.json();
      } catch {
        // JSON inválido — segue em branco
      }
    } else {
      // tenta texto, só pra ter algo em caso de erro
      try {
        const txt = await res.text();
        if (txt) data = { message: txt };
      } catch {}
    }

    if (!res.ok) {
      return {
        ok: false,
        status,
        data,
        errorText: (data && (data.error || data.message)) || `HTTP ${status}`,
      };
    }

    return { ok: true, status, data };
  } catch (e: any) {
    return { ok: false, status: 0, errorText: e?.message || "Network error" };
  }
}
