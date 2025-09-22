"use client";

/**
 * Chama @imgly/background-removal com suporte a progresso real (0–100).
 * - Tenta: fn(input, { device, output, progress })
 * - Se falhar por assinatura/tipos, cai para fn(input) (sem progresso)
 */
export async function aiRemoveBackground(
  input: Blob | ArrayBuffer | Uint8Array | string | URL,
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const mod: any = await import("@imgly/background-removal");
  const fn: any = mod?.default ?? mod?.removeBackground ?? mod;

  if (typeof fn !== "function") {
    throw new Error(
      "@imgly/background-removal: export não é função. Verifique a versão instalada."
    );
  }

  // Opções com callback de progresso (tipagem flexível)
  const opts: any = {
    device: "gpu",
    output: { format: "image/png", quality: 0.92 },
    progress: (_key: string, current: number, total: number) => {
      if (onProgress) onProgress(current, total);
    },
  };

  try {
    // 1ª tentativa: com opções (para exibir progresso)
    const out: Blob = await fn(input, opts);
    return out;
  } catch {
    // Fallback: sem opções (algumas builds expõem só a assinatura simples)
    const out: Blob = await fn(input);
    return out;
  }
}
