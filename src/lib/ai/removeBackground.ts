"use client";

import removeBackground, { Config } from "@imgly/background-removal";

/**
 * Remove o fundo de uma imagem (Blob | File | URL | ArrayBuffer).
 * Retorna um Blob (PNG com transparência por padrão).
 * Dica: na 1ª execução baixa os modelos; nas próximas fica bem mais rápido.
 */
export async function aiRemoveBackground(
  input: Blob | ArrayBuffer | Uint8Array | string | URL,
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const cfg: Config = {
    // usa GPU quando disponível (WebGPU). cai para CPU automaticamente.
    device: "gpu",
    output: { format: "image/png", type: "foreground", quality: 0.92 },
    progress: (_key, current, total) => {
      if (onProgress) onProgress(current, total);
    },
  };
  const out = await removeBackground(input, cfg);
  return out;
}
