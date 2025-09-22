"use client";

import imglyRemoveBackground from "@imgly/background-removal";

/**
 * Remove o fundo de uma imagem (Blob | File | URL | ArrayBuffer).
 * Retorna um Blob (PNG com transparência).
 *
 * Observação:
 * - Algumas versões expõem opções no 2º argumento, mas os types que você tem
 *   não incluem essa sobrecarga. Para máxima compatibilidade, usamos 1 argumento.
 */
export async function aiRemoveBackground(
  input: Blob | ArrayBuffer | Uint8Array | string | URL,
  // Mantemos a assinatura para futuro uso, mas não usamos aqui:
  _onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const out = await imglyRemoveBackground(input);
  return out as Blob;
}
