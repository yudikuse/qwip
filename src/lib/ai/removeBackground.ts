"use client";

import removeBackground, { type Config } from "@imgly/background-removal";

/**
 * Remove o fundo de uma imagem (Blob | File | URL | ArrayBuffer).
 * Retorna um Blob (PNG com transparência).
 */
export async function aiRemoveBackground(
  input: Blob | ArrayBuffer | Uint8Array | string | URL,
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const cfg: Config = {
    // Usa WebGPU/GPU quando disponível; cai para CPU automaticamente.
    device: "gpu",
    // ATENÇÃO: 'type' NÃO existe aqui. Somente 'format' e 'quality'.
    output: { format: "image/png", quality: 0.92 },
    progress: (_key, current, total) => {
      if (onProgress) onProgress(current, total);
    },
  };

  // A lib já retorna um Blob (PNG com alpha)
  const out = await removeBackground(input, cfg);
  return out;
}
